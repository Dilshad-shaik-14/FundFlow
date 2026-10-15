import mongoose from 'mongoose';
import { z } from 'zod';
import Investor from '../models/Investor.js';
import Startup from '../models/Startup.js';
import HttpError from '../utils/HttpError.js';

const websiteSchema = z.union([z.literal(''), z.string().url().max(2048)]);

const startupFields = {
  name: z.string().trim().min(2).max(120),
  industry: z.string().trim().max(80),
  description: z.string().trim().max(2000),
  website: websiteSchema,
  fundingGoal: z.number().finite().nonnegative(),
  fundingRaised: z.number().finite().nonnegative(),
};

const createStartupSchema = z
  .object({
    name: startupFields.name,
    industry: startupFields.industry.optional(),
    description: startupFields.description.optional(),
    website: startupFields.website.optional(),
    fundingGoal: startupFields.fundingGoal.optional(),
    fundingRaised: startupFields.fundingRaised.optional(),
  })
  .strict();

const updateStartupSchema = z
  .object(startupFields)
  .partial()
  .strict()
  .refine((startup) => Object.keys(startup).length > 0);

function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body is invalid.', result.error.issues);
  }

  return result.data;
}

function parseStartupId(value) {
  if (!mongoose.isValidObjectId(value)) {
    throw new HttpError(400, 'INVALID_ID', 'Startup ID is invalid.');
  }
}

function serializeStartup(startup) {
  return {
    id: startup._id.toString(),
    name: startup.name,
    industry: startup.industry,
    description: startup.description,
    website: startup.website,
    fundingGoal: startup.fundingGoal,
    fundingRaised: startup.fundingRaised,
    createdAt: startup.createdAt,
    updatedAt: startup.updatedAt,
  };
}

export async function listStartups(request, response) {
  const startups = await Startup.find({ owner: request.auth.userId }).sort({ createdAt: -1 });

  response.json({
    success: true,
    data: { startups: startups.map(serializeStartup) },
  });
}

export async function createStartup(request, response) {
  const input = parseBody(createStartupSchema, request.body);
  const startup = await Startup.create({ ...input, owner: request.auth.userId });

  response.status(201).json({
    success: true,
    data: { startup: serializeStartup(startup) },
  });
}

export async function getStartup(request, response) {
  parseStartupId(request.params.startupId);
  const startup = await Startup.findOne({
    _id: request.params.startupId,
    owner: request.auth.userId,
  });

  if (!startup) {
    throw new HttpError(404, 'STARTUP_NOT_FOUND', 'Startup was not found.');
  }

  response.json({ success: true, data: { startup: serializeStartup(startup) } });
}

export async function updateStartup(request, response) {
  parseStartupId(request.params.startupId);
  const input = parseBody(updateStartupSchema, request.body);
  const startup = await Startup.findOneAndUpdate(
    { _id: request.params.startupId, owner: request.auth.userId },
    { $set: input },
    { new: true, runValidators: true },
  );

  if (!startup) {
    throw new HttpError(404, 'STARTUP_NOT_FOUND', 'Startup was not found.');
  }

  response.json({ success: true, data: { startup: serializeStartup(startup) } });
}

export async function deleteStartup(request, response) {
  parseStartupId(request.params.startupId);
  const startup = await Startup.findOne({
    _id: request.params.startupId,
    owner: request.auth.userId,
  });

  if (!startup) {
    throw new HttpError(404, 'STARTUP_NOT_FOUND', 'Startup was not found.');
  }

  const linkedInvestor = await Investor.exists({
    owner: request.auth.userId,
    startup: startup._id,
  });

  if (linkedInvestor) {
    throw new HttpError(
      409,
      'STARTUP_HAS_INVESTORS',
      'Remove this startup’s investors before deleting the startup.',
    );
  }

  await Startup.deleteOne({ _id: startup._id, owner: request.auth.userId });
  await Investor.deleteMany({ owner: request.auth.userId, startup: startup._id });

  response.json({ success: true, data: { message: 'Startup deleted successfully.' } });
}
