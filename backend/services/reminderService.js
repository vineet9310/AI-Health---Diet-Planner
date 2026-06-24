const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const ProgressLog = require('../models/ProgressLog');

/**
 * Setup SMTP Transporter for Nodemailer
 */
const getTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail', // default service, can be changed
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  // Fallback to a mock transporter
  return {
    sendMail: async (mailOptions) => {
      console.log('--- Mock Email Sent ---');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: ${mailOptions.text}`);
      console.log('-----------------------');
      return { messageId: 'mock-id-12345' };
    }
  };
};

/**
 * Start Cron Job for daily check-in reminders (Runs at 8:00 PM every day)
 */
const startReminderCron = () => {
  // Cron schedule: "0 20 * * *" = 8:00 PM (20:00) every day
  // Let's run every day at 8:00 PM
  cron.schedule('0 20 * * *', async () => {
    console.log('Running daily progress log reminder job...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all regular users
      const users = await User.find({ role: 'user' });
      const transporter = getTransporter();

      for (const user of users) {
        // Check if user logged progress today
        const log = await ProgressLog.findOne({
          user: user._id,
          date: { $gte: today }
        });

        if (!log) {
          // Send reminder email
          const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@vitalplan.com',
            to: user.email,
            subject: 'VitalPlan - Log Your Daily Progress!',
            text: `Hi ${user.name},\n\nYou haven't logged your health, meals, or workouts for today. Consistently logging your progress is key to achieving your fitness goals!\n\nHead over to the VitalPlan dashboard now to log your stats: ${process.env.CLIENT_URL || 'http://localhost:3000'}/progress\n\nStay healthy,\nVitalPlan Team`
          };

          await transporter.sendMail(mailOptions);
        }
      }
      console.log('Daily progress log reminder emails sent out successfully.');
    } catch (error) {
      console.error('Error running daily progress log reminder cron:', error);
    }
  });
};

module.exports = { startReminderCron };
