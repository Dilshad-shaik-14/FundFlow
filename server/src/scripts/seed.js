import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
import Startup from '../models/Startup.js';
import Investor from '../models/Investor.js';

export async function seedDatabase(targetEmail) {
  await connectDatabase();

  const user = targetEmail
    ? await User.findOne({ email: targetEmail.toLowerCase() })
    : await User.findOne().sort({ createdAt: 1 });

  if (!user) {
    console.error('No user found in database. Please register an account first.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Seeding sample portfolio for user: ${user.name} (${user.email})...`);

  // Create sample startups
  const startups = await Startup.insertMany([
    {
      owner: user._id,
      name: 'HyperScale AI',
      industry: 'Artificial Intelligence',
      description: 'Distributed model inference and latency optimization infrastructure.',
      website: 'https://hyperscale.example.com',
      fundingGoal: 2500000,
      fundingRaised: 1850000,
    },
    {
      owner: user._id,
      name: 'GreenPulse Energy',
      industry: 'CleanTech',
      description: 'Next-generation grid balancing software for commercial battery storage.',
      website: 'https://greenpulse.example.com',
      fundingGoal: 1200000,
      fundingRaised: 500000,
    },
    {
      owner: user._id,
      name: 'NovaHealth',
      industry: 'HealthTech',
      description: 'AI-assisted medical imaging workflow automation for clinical radiology.',
      website: 'https://novahealth.example.com',
      fundingGoal: 800000,
      fundingRaised: 250000,
    },
  ]);

  const [aiStartup, greenStartup, healthStartup] = startups;

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const today = new Date(now);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Create sample investors across different statuses and follow-up timelines
  await Investor.insertMany([
    {
      owner: user._id,
      startup: aiStartup._id,
      name: 'Sarah Chen',
      firm: 'Apex Horizon Ventures',
      email: 'sarah.chen@apexhorizon.example.com',
      status: 'committed',
      followUpDate: null,
      notes: 'Leading $1M seed tranche. Term sheet signed.',
    },
    {
      owner: user._id,
      startup: aiStartup._id,
      name: 'Marcus Vance',
      firm: 'Velocity Capital',
      email: 'marcus@velocitycap.example.com',
      status: 'meeting_scheduled',
      followUpDate: inThreeDays,
      notes: 'Partner meeting scheduled for Thursday to review technical diligence.',
    },
    {
      owner: user._id,
      startup: greenStartup._id,
      name: 'Elena Rostova',
      firm: 'EcoFuture Ventures',
      email: 'elena@ecofuture.example.com',
      status: 'contacted',
      followUpDate: today,
      notes: 'Sent pitch deck and utility pilot data. Follow up today regarding feedback.',
    },
    {
      owner: user._id,
      startup: greenStartup._id,
      name: 'David Kim',
      firm: 'Beacon Ridge Capital',
      email: 'david.kim@beaconridge.example.com',
      status: 'potential',
      followUpDate: yesterday,
      notes: 'Met at climate summit. Overdue follow-up on introductory email.',
    },
    {
      owner: user._id,
      startup: healthStartup._id,
      name: 'Rachel Adams',
      firm: 'BioSphere Partners',
      email: 'rachel@biosphere.example.com',
      status: 'passed',
      followUpDate: null,
      notes: 'Passed for this round due to stage requirements; requested updates for Series A.',
    },
  ]);

  console.log('Successfully seeded sample startups and investors!');
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seed.js')) {
  const targetEmail = process.argv[2];
  seedDatabase(targetEmail)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
