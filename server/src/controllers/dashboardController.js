import mongoose from 'mongoose';
import { INVESTOR_STATUSES } from '../models/Investor.js';
import Investor from '../models/Investor.js';
import Startup from '../models/Startup.js';

const ACTIVE_INVESTOR_STATUSES = ['potential', 'contacted', 'meeting_scheduled'];

function getUtcDateBoundaries() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const nextWeekStart = new Date(tomorrowStart);
  nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);

  return { todayStart, tomorrowStart, nextWeekStart };
}

function emptyInvestorMetrics() {
  return {
    investorCount: 0,
    investorStatusCounts: Object.fromEntries(INVESTOR_STATUSES.map((status) => [status, 0])),
    overdueFollowUps: 0,
    followUpsDueToday: 0,
    upcomingFollowUps: 0,
  };
}

export async function getDashboardMetrics(request, response) {
  const ownerId = new mongoose.Types.ObjectId(request.auth.userId);
  const { todayStart, tomorrowStart, nextWeekStart } = getUtcDateBoundaries();

  const [startupResults, investorResults] = await Promise.all([
    Startup.aggregate([
      { $match: { owner: ownerId } },
      {
        $group: {
          _id: null,
          startupCount: { $sum: 1 },
          totalFundingGoal: { $sum: '$fundingGoal' },
          totalFundingRaised: { $sum: '$fundingRaised' },
        },
      },
    ]),
    Investor.aggregate([
      { $match: { owner: ownerId } },
      {
        $lookup: {
          from: Startup.collection.name,
          let: { startupId: '$startup', investorOwner: '$owner' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$startupId'] },
                    { $eq: ['$owner', '$$investorOwner'] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'ownedStartup',
        },
      },
      { $match: { 'ownedStartup.0': { $exists: true } } },
      {
        $group: {
          _id: null,
          investorCount: { $sum: 1 },
          ...Object.fromEntries(
            INVESTOR_STATUSES.map((status) => [
              `status_${status}`,
              {
                $sum: {
                  $cond: [{ $eq: ['$status', status] }, 1, 0],
                },
              },
            ]),
          ),
          overdueFollowUps: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ACTIVE_INVESTOR_STATUSES] },
                    { $ne: ['$followUpDate', null] },
                    { $lt: ['$followUpDate', todayStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          followUpsDueToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ACTIVE_INVESTOR_STATUSES] },
                    { $gte: ['$followUpDate', todayStart] },
                    { $lt: ['$followUpDate', tomorrowStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          upcomingFollowUps: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ACTIVE_INVESTOR_STATUSES] },
                    { $gte: ['$followUpDate', tomorrowStart] },
                    { $lt: ['$followUpDate', nextWeekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const startupMetrics = startupResults[0] ?? {
    startupCount: 0,
    totalFundingGoal: 0,
    totalFundingRaised: 0,
  };
  const investorMetrics = investorResults[0]
    ? {
        investorCount: investorResults[0].investorCount,
        investorStatusCounts: Object.fromEntries(
          INVESTOR_STATUSES.map((status) => [status, investorResults[0][`status_${status}`]]),
        ),
        overdueFollowUps: investorResults[0].overdueFollowUps,
        followUpsDueToday: investorResults[0].followUpsDueToday,
        upcomingFollowUps: investorResults[0].upcomingFollowUps,
      }
    : emptyInvestorMetrics();

  response.json({
    success: true,
    data: {
      metrics: {
        startupCount: startupMetrics.startupCount,
        totalFundingGoal: startupMetrics.totalFundingGoal,
        totalFundingRaised: startupMetrics.totalFundingRaised,
        ...investorMetrics,
      },
    },
  });
}
