const nodemailer = require("nodemailer");

const sendEmailResult = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: auto;">
          <div style="border-bottom: 4px solid #043345; padding-bottom: 10px;">
            <h1 style="font-size: 24px; color: #333;">Assessment Plus™</h1>
          </div>
          <p>Dear ${options.name},</p>
          <p>Thank you for participating in the <strong>Career Test - EUT - Set 5 - Standalone</strong> scheduled by <strong>CoCubes.com</strong>. Your responses were successfully submitted on <strong>30 Aug, 2020 02:53 PM</strong>.</p>
          <p>You scored <strong>1.00</strong> out of <strong>50.00</strong> in this 60 minutes assessment.</p>
          <p>Below is your sectional performance report:</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="text-align: left; background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd;">Section</th>
                <th style="text-align: left; background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd;">Score</th>
                <th style="text-align: left; background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd;">Percent</th>
              </tr>
            </thead>
            <tbody>
            ${options.topics.map((topic) => {
        return (
          `<tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${topic.Heading}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${topic.totalMarks +' out of ' + topic.topicMarks}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${(topic.totalMarks/topic.topicMarks)*100}%</td>
              </tr>`
        )
      })}            
            </tbody>
          </table>

          <p style="margin-top: 20px;">Best Regards,<br/>CoCubes.com</p>
        </div>
      `,
    };

    const mail = await transporter.sendMail(mailOptions);
    return { success: true, message: "Mail sent successfully", mail };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Email not sent" };
  }
};

module.exports = sendEmailResult;
