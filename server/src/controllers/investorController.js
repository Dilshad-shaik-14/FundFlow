import mongoose from 'mongoose';
import { z } from 'zod';
import { INVESTOR_STATUSES } from '../models/Investor.js';
import Investor from '../models/Investor.js';
import Startup from '../models/Startup.js';
import HttpError from '../utils/HttpError.js';

const dateOnlySchema = z.string().date();
const investorFields = {
  name: z.string().trim().min(2).max(120),
  firm: z.string().trim().max(120),
  email: z.union([z.literal(''), z.string().trim().email().max(254)]),
  status: z.enum(INVESTOR_STATUSES),
  followUpDate: dateOnlySchema.nullable(),
  notes: z.string().trim().max(2000),
};

const createInvestorSchema = z
  .object({
    startupId: z.string().refine(mongoose.isValidObjectId),
    name: investorFields.name,
    firm: investorFields.firm.optional(),
    email: investorFields.email.optional(),
    status: investorFields.status.optional(),
    followUpDate: investorFields.followUpDate.optional(),
    notes: investorFields.notes.optional(),
  })
  .strict();

const updateInvestorSchema = z
  .object({
    startupId: z.string().refine(mongoose.isValidObjectId).optional(),
    name: investorFields.name.optional(),
    firm: investorFields.firm.optional(),
    email: investorFields.email.optional(),
    status: investorFields.status.optional(),
    followUpDate: investorFields.followUpDate.optional(),
    notes: investorFields.notes.optional(),
  })
  .strict()
  .refine((investor) => Object.keys(investor).length > 0);

const listInvestorQuerySchema = z
  .object({
    startupId: z.string().refine(mongoose.isValidObjectId).optional(),
    status: z.enum(INVESTOR_STATUSES).optional(),
  })
  .strict();

function parseWithSchema(schema, input, message = 'Request data is invalid.') {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', message, result.error.issues);
  }

  return result.data;
}

function parseInvestorId(value) {
  if (!mongoose.isValidObjectId(value)) {
    throw new HttpError(400, 'INVALID_ID', 'Investor ID is invalid.');
  }
}

function asDate(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function serializeInvestor(investor, startup) {
  return {
    id: investor._id.toString(),
    startup: { id: startup._id.toString(), name: startup.name },
    name: investor.name,
    firm: investor.firm,
    email: investor.email,
    status: investor.status,
    followUpDate: investor.followUpDate?.toISOString().slice(0, 10) ?? null,
    notes: investor.notes,
    createdAt: investor.createdAt,
    updatedAt: investor.updatedAt,
  };
}

async function findOwnedStartup(startupId, ownerId) {
  const startup = await Startup.findOne({ _id: startupId, owner: ownerId });

  if (!startup) {
    throw new HttpError(404, 'STARTUP_NOT_FOUND', 'Startup was not found.');
  }

  return startup;
}

async function findOwnedInvestor(investorId, ownerId) {
  parseInvestorId(investorId);
  const investor = await Investor.findOne({ _id: investorId, owner: ownerId });

  if (!investor) {
    throw new HttpError(404, 'INVESTOR_NOT_FOUND', 'Investor was not found.');
  }

  const startup = await Startup.findOne({
    _id: investor.startup,
    owner: ownerId,
  });

  if (!startup) {
    throw new HttpError(404, 'INVESTOR_NOT_FOUND', 'Investor was not found.');
  }

  return { investor, startup };
}

export async function listInvestors(request, response) {
  const filters = parseWithSchema(
    listInvestorQuerySchema,
    request.query,
    'Investor filters are invalid.',
  );
  const query = { owner: request.auth.userId };

  if (filters.startupId) {
    await findOwnedStartup(filters.startupId, request.auth.userId);
    query.startup = filters.startupId;
  } else {
    const startups = await Startup.find({ owner: request.auth.userId }).select('_id');
    query.startup = { $in: startups.map(({ _id }) => _id) };
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const investors = await Investor.find(query).sort({ createdAt: -1 });
  const startupIds = [...new Set(investors.map(({ startup }) => startup.toString()))];
  const startups = await Startup.find({
    _id: { $in: startupIds },
    owner: request.auth.userId,
  }).select('name');
  const startupsById = new Map(startups.map((startup) => [startup._id.toString(), startup]));

  response.json({
    success: true,
    data: {
      investors: investors
        .filter((investor) => startupsById.has(investor.startup.toString()))
        .map((investor) => serializeInvestor(investor, startupsById.get(investor.startup.toString()))),
    },
  });
}

export async function createInvestor(request, response) {
  const input = parseWithSchema(createInvestorSchema, request.body);
  const startup = await findOwnedStartup(input.startupId, request.auth.userId);
  const { startupId, followUpDate, ...fields } = input;
  const investor = await Investor.create({
    ...fields,
    owner: request.auth.userId,
    startup: startup._id,
    ...(followUpDate !== undefined && { followUpDate: asDate(followUpDate) }),
  });

  response.status(201).json({
    success: true,
    data: { investor: serializeInvestor(investor, startup) },
  });
}

export async function getInvestor(request, response) {
  const { investor, startup } = await findOwnedInvestor(
    request.params.investorId,
    request.auth.userId,
  );

  response.json({
    success: true,
    data: { investor: serializeInvestor(investor, startup) },
  });
}

export async function updateInvestor(request, response) {
  const input = parseWithSchema(updateInvestorSchema, request.body);
  const { investor, startup: currentStartup } = await findOwnedInvestor(
    request.params.investorId,
    request.auth.userId,
  );
  const { startupId, followUpDate, ...fields } = input;
  const startup = startupId
    ? await findOwnedStartup(startupId, request.auth.userId)
    : currentStartup;
  const updatedInvestor = await Investor.findOneAndUpdate(
    {
      _id: investor._id,
      owner: request.auth.userId,
      startup: investor.startup,
    },
    {
      $set: {
        ...fields,
        ...(startupId && { startup: startup._id }),
        ...(followUpDate !== undefined && { followUpDate: asDate(followUpDate) }),
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedInvestor) {
    throw new HttpError(404, 'INVESTOR_NOT_FOUND', 'Investor was not found.');
  }

  response.json({
    success: true,
    data: { investor: serializeInvestor(updatedInvestor, startup) },
  });
}

export async function deleteInvestor(request, response) {
  const { investor } = await findOwnedInvestor(request.params.investorId, request.auth.userId);
  const deletedInvestor = await Investor.findOneAndDelete({
    _id: investor._id,
    owner: request.auth.userId,
    startup: investor.startup,
  });

  if (!deletedInvestor) {
    throw new HttpError(404, 'INVESTOR_NOT_FOUND', 'Investor was not found.');
  }

  response.json({ success: true, data: { message: 'Investor deleted successfully.' } });
}
