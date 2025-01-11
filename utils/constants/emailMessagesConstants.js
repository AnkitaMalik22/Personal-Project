const sendMailForTestAdded = (entity, role, college, test) => {
    try {
        if (role === 'college' && entity?.driveName) {
            const subject = `New Test Added for ${entity.driveName} Campus Drive`;
            const html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Test Added</title>
                <style>
                    :root {
                        --primary-color: #6eb9be;
                        --primary-dark: #0D9AAC;
                        --text-color: #333;
                        --background-color: #F1F4F8;
                        --container-bg: #ffffff;
                        --border-color: #e0e0e0;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: var(--text-color);
                        background-color: var(--background-color);
                        margin: 0;
                        padding: 0;
                    }
            
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        padding: 40px;
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        background-color: var(--container-bg);
                    }
            
                    .logo {
                        display: block;
                        width: 120px;
                        margin: 0 auto 30px;
                    }
            
                    .header {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        color: var(--primary-dark);
                    }
            
                    h3 {
                        color: var(--primary-dark);
                        margin-top: 30px;
                    }
            
                    .button {
                        display: inline-block;
                        margin: 20px 0;
                        padding: 12px 24px;
                        color: white;
                        background-color: var(--primary-color);
                        text-decoration: none;
                        border-radius: 5px;
                        font-size: 16px;
                        font-weight: bold;
                    }
            
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid var(--border-color);
                        font-size: 14px;
                        color: #555;
                    }
            
                    ul {
                        padding-left: 20px;
                    }
            
                    li {
                        margin-bottom: 10px;
                    }
            
                    @media (max-width: 768px) {
                        .container {
                            padding: 20px;
                            margin: 20px auto;
                        }
                        
                        .logo {
                            width: 100px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img class="logo" src="https://shorturl.at/gtQFu" alt="Skill Access Logo">
                    
                    <div class="header">Test Added for ${entity.driveName}</div>
                    
                    <p>Dear ${college?.CollegeName},</p>
                    
                    <p>
                        A new test "${test.name}" has been added to the campus drive.
                        Test will start from ${new Date(test.startDate).toLocaleString()} 
                        and end at ${new Date(test.endDate).toLocaleString()}.
                    </p>
                    
                    <a href="${process.env.FRONTEND_URL}/campus-drive/${entity._id}" class="button">
                        View Test Details
                    </a>
                    
                    <div class="footer">
                        Best regards,<br>
                        Skill Access Team
                    </div>
                </div>
            </body>
            </html>`;

            return { subject, html };
        }
    } catch (error) {
        console.error('Error in sendMailForTestAdded:', error);
        return {
            subject: 'New Test Added',
            html: '<p>A new test has been added. Please login to view details.</p>'
        };
    }
};

module.exports = { sendMailForTestAdded };
