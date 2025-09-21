module.exports = function planExpiredTemplate(firstName, planName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Subscription Has Expired</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #ff6b6b;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: left;
            color: #333333;
          }
          .content p {
            line-height: 1.6;
            font-size: 16px;
          }
          .cta-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 25px;
            background-color: #ff6b6b;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          }
          .footer {
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #999999;
            background-color: #f6f6f6;
          }
          .footer a {
            color: #ff6b6b;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expired</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || "there"},</p>
            <p>
              We wanted to let you know that your <strong>${planName}</strong> subscription has expired.
            </p>
            <p>
              To continue enjoying uninterrupted access to our services, please renew your plan in the website
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AI Career. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  