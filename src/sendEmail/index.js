import { paymentFailedEmailBody } from "./paymentFailedEmail";

const AWS = require("aws-sdk");
require("dotenv").config();

// const config = require('./config'); // load configurations file

AWS.config.update({
  accessKeyId: process.env.SES_KEY_ID,
  secretAccessKey: process.env.SES_KEY,
  region: process.env.SES_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

export const sendCancellationRequest = async (name, phone, email, reason, customerId) => {
  sendEmail(
    "CANCELLATION REQUEST",
    `<html><body>Name: ${name} <br> Phone: ${phone} <br> Email: ${email} <br> Reason for Cancelling: ${reason} <br> Customer ID: ${customerId}</body></html>`,
    [process.env.EMAIL_SUPPORT]
  );
}

export const sendSignupEmail = async (recipient) => {
  sendEmail("Welcome to Terminal!", signupEmailBody, [recipient]);
};

export const sendPaymentFailedEmail = async (recipient) => {
  sendEmail(
    `${process.env.FRONTEND_TITLE} Payment Failure: Update your payment details today!`,
    paymentFailedEmailBody,
    [recipient]
  );
};

export const sendDemoRequest = async (name, phone, email) => {
  sendEmail(
      "DEMO REQUEST",
      `<html><body>Name: ${name} <br> Phone: ${phone} <br> Email: ${email}</body></html>`,
      [process.env.EMAIL_SUPPORT]
  );
}

// const sendEmail = (to, subject, message, from) => {
const sendEmail = (subject, body, recipients) => {
  const params = {
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          // Data: "<html><body><h1>Hello GURGO</h1><p style='color:red'>Sample description</p> <p>Time 1517831318946</p></body></html>"
          Data: body,
        },
        /* replace Html attribute with the following if you want to send plain text emails.
                Text: {
                    Charset: "UTF-8",
                    Data: message
                }
             */
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    ReturnPath: `"${process.env.FRONTEND_ENDPOINT}" <${process.env.EMAIL_SUPPORT}>`,
    Source: `"${process.env.FRONTEND_ENDPOINT}" <${process.env.EMAIL_SUPPORT}>`,
  };

  ses.sendEmail(params, (err, data) => {
    if (err) {
      return console.log(err, err.stack);
    } else {
      console.log("Intro email sent.", data);
    }
  });
};

const signupEmailBody = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 15]>
		<xml>
			<o:OfficeDocumentSettings>
			<o:AllowPNG/>
			<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
		<![endif]--><meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>*|MC:SUBJECT|*</title>
</head>
<body style="height:100%;margin:0;padding:0;width:100%;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;background-color:#DEE0E2;">
        <!--*|IF:MC_PREVIEW_TEXT|*-->
        <!--[if !gte mso 9]><!----><!--<![endif]-->
        <!--*|END:IF|*-->
        <center>
            <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;height:100%;margin:0;padding:0;width:100%;background-color:#DEE0E2;"><tr>
<td align="center" valign="top" id="bodyCell" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;height:100%;margin:0;padding:10px;width:100%;border-top:0;">
                        <!-- BEGIN TEMPLATE // -->
						<!--[if gte mso 9]>
						<table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;">
						<tr>
						<td align="center" valign="top" width="600" style="width:600px;">
						<![endif]-->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="templateContainer" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;max-width:600px !important;border:0;width:600px !important;">
<tr>
<td valign="top" id="templatePreheader" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;background-color:#DEE0E2;border-top:0;border-bottom:0;padding-top:9px;padding-bottom:9px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="600" style="width:600px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding:0px 18px 9px;text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#656565;font-family:Helvetica;font-size:12px;line-height:150%;">

                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table></td>
                            </tr>
<tr>
<td valign="top" id="bodyContainer" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;background-color:#FFFFFF;">
									<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
<tr>
<td valign="top" id="templateHeader" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;padding-right:22px;padding-left:22px;background-color:#FFFFFF;border-top:10px solid #A6BFC9;border-bottom:0;padding-top:32px;padding-bottom:52px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="600" style="width:600px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#43404D;font-family:Georgia;font-size:16px;line-height:150%;text-align:center;">

                            <h1 style="text-align:center;display:block;margin:0;padding:0;color:#3F3A38;font-family:Georgia;font-size:40px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:normal;">
<strong><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif">Welcome to Terminal by ${
  process.env.FRONTEND_TITLE
}!</span></strong><br>
&nbsp;</h1>

                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnImageBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnImageBlockOuter"><tr>
<td valign="top" style="padding:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" class="mcnImageBlockInner">
                    <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td class="mcnImageContent" valign="top" style="padding-right:9px;padding-left:9px;padding-top:0;padding-bottom:0;text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">


                                        <img align="center" alt="" src="https://mcusercontent.com/e8ce3f2e4259f85d02b1fe67f/images/39cbb2a4-65b4-42fa-a48d-aa4c4e0f15e7.jpg" width="288.75" style="max-width:1050px;padding-bottom:0;display:inline !important;vertical-align:bottom;border:0;height:auto;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" class="mcnRetinaImage">
</td>
                        </tr></tbody></table>
</td>
            </tr></tbody></table>
</td>
										</tr>
<tr>
<td valign="top" id="templateBody" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;padding-right:22px;padding-left:22px;padding-top:0;padding-bottom:22px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="600" style="width:600px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#43404D;font-family:Georgia;font-size:16px;line-height:150%;text-align:center;">

                            <h2 style="text-align:center;display:block;margin:0;padding:0;color:#3F3A38;font-family:Georgia;font-size:24px;font-style:normal;font-weight:bold;line-height:125%;letter-spacing:normal;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif">Make smarter decisions with access to America&rsquo;s billionaires, banks and institutional experts' top holdings. We put the power of an investment bank in your pocket.</span></h2>
<br>
&nbsp;
                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnButtonBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnButtonBlockOuter"><tr>
<td style="padding-top:0;padding-right:18px;padding-bottom:18px;padding-left:18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" valign="top" align="center" class="mcnButtonBlockInner">
                <table border="0" cellpadding="0" cellspacing="0" class="mcnButtonContentContainer" style="border-collapse:collapse;border-radius:13px;background-color:#5C93F2;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td align="center" valign="middle" class="mcnButtonContent" style='font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;font-size:16px;padding:15px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;'>
                                <a class="mcnButton " title="Sign in to your account" href="https://${
                                  process.env.FRONTEND_ENDPOINT
                                }/signin" target="_blank" style="font-weight:bold;letter-spacing:normal;line-height:100%;text-align:center;text-decoration:none;color:#FFFFFF;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;display:block;">Sign in to your account </a>
                            </td>
                        </tr></tbody></table>
</td>
        </tr></tbody></table>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="600" style="width:600px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#43404D;font-family:Georgia;font-size:16px;line-height:150%;text-align:center;">

                            <div style="text-align: center;">
<br><span style="font-size:15px"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif">Congratulations! You now have full access to an extraordinary range of data sources, with multi-asset content that includes company and economy data, insights, analytics, and powerful AI tools that accelerate transparency and speed in capital markets.<br><br>
Your 7-day free trial starts now. Make the most out of it.&nbsp;<br>
Here are just a few of the many great benefits included with your membership:</span></span><br>
&nbsp;</div>

<ul>
<li style="text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif"><strong>Discover pre-allocated portfolios of billionaires, banks, trust, and retirement systems&nbsp;</strong></span></li>
</ul>
<div style="text-align: left;">&nbsp;</div>

<ul>
<li style="text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif"><strong>Access quarterly holdings of any individual or institution controlling investments of at least $100 million</strong></span></li>
</ul>
<div style="text-align: left;">&nbsp;</div>

<ul>
<li style="text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif"><strong>Invest alongside the world's smartest and most sophisticated decision-makers from the comfort of your home</strong></span></li>
</ul>
<div style="text-align: left;">&nbsp;</div>

<p style="text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;color:#43404D;font-family:Georgia;font-size:16px;line-height:150%;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif"><span style="font-size:15px">Thank you,<br><br><strong>${
  process.env.FRONTEND_TITLE
} Terminal</strong></span><br><br>

Need to reset your password? <strong><a href="https://${
  process.env.FRONTEND_ENDPOINT
}/reset-password" target="_blank" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;color:#5c93f2;font-weight:normal;text-decoration:underline;"><span style="color:#5c93f2">Click here</span></a></strong></span></p>

<br></br>

For help getting started, as well as ${
  process.env.FRONTEND_TITLE
} tips and best practices, visit our <strong><a href="https://${
  process.env.FRONTEND_KNOWLEDGE_CENTER_URL
}" target="_blank" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;color:#5c93f2;font-weight:normal;text-decoration:underline;"><span style="color:#5c93f2">Knowledge Center</span></a></strong></span>.

<br></br>

                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table>
</td>
										</tr>
<tr>
<td align="center" valign="top" id="templateColumns" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;padding-right:22px;padding-left:22px;">
												<!--[if gte mso 9]>
												<table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
												<tr>
												<td align="center" valign="top" width="373" style="width:373px;">
												<![endif]-->
												<div class="columnContainer" style="display:inline-block; max-width:373px; vertical-align:top; width:100%;">
													<table align="left" border="0" cellpadding="0" cellspacing="0" width="373" id="templateLowerBody" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
<tr>
<td valign="top" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
																<table border="0" cellpadding="0" cellspacing="0" height="5" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tr>
<td height="5" width="18" style="font-size:0;line-height:0;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">&nbsp;</td>
																		<td background="https://cdn-images.mailchimp.com/template_images/gallery/diagborder.png" bgcolor="#FFFFFF" height="5" valign="top" class="borderBar" style="font-size:0;line-height:0;min-width:337px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
																			<!--[if gte mso 9]>
																			<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:337px;height:5px;">
																			<v:fill type="tile" src="https://cdn-images.mailchimp.com/template_images/gallery/diagborder.png" color="#FFFFFF" />
																			<v:textbox inset="0,0,0,0">
																			<![endif]-->
																			&nbsp;
																			<!--[if gte mso 9]>
																			</v:textbox>
																			</v:rect>
																			<![endif]-->
																		</td>
																		<td height="5" width="18" style="font-size:0;line-height:0;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">&nbsp;</td>
																	</tr></table>
</td>
														</tr>
<tr>
<td id="lowerBodyContainer" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;padding-top:0px;padding-bottom:22px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="373" style="width:373px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding:0px 18px 9px;font-family:Georgia;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#43404D;font-size:14px;line-height:150%;text-align:center;">

                            <h4 style="display:block;margin:0;padding:0;color:#3F3A38;font-family:Georgia;font-size:12px;font-style:normal;font-weight:bold;line-height:125%;letter-spacing:normal;text-align:center;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif">ABOUT ${process.env.FRONTEND_TITLE.toUpperCase()}</span></h4>

<p style="font-family:Georgia;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;color:#43404D;font-size:14px;line-height:150%;text-align:center;"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif">Our mission is to democratize access for the world&rsquo;s most valuable financial data and bring transparency to capital markets</span>.</p>

                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table></td>
														</tr>
</table>
</div>
												<!--[if gte mso 9]>
												</td>
												<td align="center" valign="top" width="178" style="width:178px;">
												<![endif]-->
												<div class="columnContainer" style="display:inline-block; max-width:178px; vertical-align:top; width:100%;">
													<table align="left" border="0" cellpadding="0" cellspacing="0" width="178" id="templateSidebar" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
<tr>
<td height="5" valign="top" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
																<table border="0" cellpadding="0" cellspacing="0" height="5" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tr>
<td height="5" width="18" style="font-size:0;line-height:0;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">&nbsp;</td>
																		<td background="https://cdn-images.mailchimp.com/template_images/gallery/diagborder.png" bgcolor="#FFFFFF" height="5" valign="top" class="borderBar" style="font-size:0;line-height:0;min-width:142px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
																			<!--[if gte mso 9]>
																			<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:142px;height:5px;">
																			<v:fill type="tile" src="https://cdn-images.mailchimp.com/template_images/gallery/diagborder.png" color="#FFFFFF" />
																			<v:textbox inset="0,0,0,0">
																			<![endif]-->
																			&nbsp;
																			<!--[if gte mso 9]>
																			</v:textbox>
																			</v:rect>
																			<![endif]-->
																		</td>
																		<td height="5" width="18" style="font-size:0;line-height:0;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">&nbsp;</td>
																	</tr></table>
</td>
														</tr>
<tr>
<td valign="top" id="sidebarContainer" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;padding-top:0;padding-bottom:22px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="178" style="width:178px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#43404D;font-family:Georgia;font-size:14px;line-height:150%;text-align:center;">

                            <h4 style="text-align:center;display:block;margin:0;padding:0;color:#3F3A38;font-family:Georgia;font-size:12px;font-style:normal;font-weight:bold;line-height:125%;letter-spacing:normal;">
<span style="font-size:12px"><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif">CUSTOMER SERVICE CENTER<br><br>
PHONE: (877) 960-0615&nbsp;<br><br>
EMAIL:&nbsp;</span></span><span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif"><span style="color:#5c93f2">${
  process.env.EMAIL_SUPPORT
}</span></span>
</h4>

                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table></td>
														</tr>
</table>
</div>
												<!--[if gte mso 9]>
												</td>
												</tr>
												</table>
												<![endif]-->
											</td>
										</tr>
<tr>
<td valign="top" id="templateFooter" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;padding-right:22px;padding-left:22px;background-color:#FFFFFF;border-top:0;border-bottom:10px solid #A6BFC9;padding-top:22px;padding-bottom:22px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnDividerBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;table-layout:fixed !important;"><tbody class="mcnDividerBlockOuter"><tr>
<td class="mcnDividerBlockInner" style="min-width:100%;padding:0px 18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                <table class="mcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;border-top:1px solid #BBBBBB;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                            <span></span>
                        </td>
                    </tr></tbody></table>
<!--
                <td class="mcnDividerBlockInner" style="padding: 18px;">
                <hr class="mcnDividerContent" style="border-bottom-color:none; border-left-color:none; border-right-color:none; border-bottom-width:0; border-left-width:0; border-right-width:0; margin-top:0; margin-right:0; margin-bottom:0; margin-left:0;" />
-->
</td>
        </tr></tbody></table>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnFollowBlockOuter"><tr>
<td align="center" valign="top" style="padding:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" class="mcnFollowBlockInner">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentContainer" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td align="center" style="padding-left:9px;padding-right:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" class="mcnFollowContent"><tbody><tr>
<td align="center" valign="top" style="padding-top:9px;padding-right:9px;padding-left:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td align="center" valign="top" style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                                    <!--[if mso]>
                                    <table align="center" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                    <![endif]-->

                                        <!--[if mso]>
                                        <td align="center" valign="top">
                                        <![endif]-->


                                            <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td valign="top" style="padding-right:0;padding-bottom:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" class="mcnFollowContentItemContainer">
                                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnFollowContentItem" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td align="left" valign="middle" style="padding-top:5px;padding-right:10px;padding-bottom:5px;padding-left:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                                                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td align="left" valign="middle" class="mcnFollowTextContent" style="padding-left:5px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                                                                                    <a href="https://${
                                                                                      process
                                                                                        .env
                                                                                        .FRONTEND_ENDPOINT
                                                                                    }" target="" style='font-family:"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif;font-size:16px;text-decoration:none;color:#5C93F2;font-weight:bold;line-height:100%;text-align:center;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;'>Visit Our Website </a>
                                                                                </td>

                                                                        </tr></tbody></table>
</td>
                                                            </tr></tbody></table>
</td>
                                                </tr></tbody></table>
<!--[if mso]>
                                        </td>
                                        <![endif]--><!--[if mso]>
                                    </tr>
                                    </table>
                                    <![endif]-->
</td>
                            </tr></tbody></table>
</td>
                </tr></tbody></table>
</td>
    </tr></tbody></table>
</td>
        </tr></tbody></table>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnDividerBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;table-layout:fixed !important;"><tbody class="mcnDividerBlockOuter"><tr>
<td class="mcnDividerBlockInner" style="min-width:100%;padding:0px 18px 22px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                <table class="mcnDividerContent" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;border-top:1px solid #BBBBBB;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody><tr>
<td style="mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
                            <span></span>
                        </td>
                    </tr></tbody></table>
<!--
                <td class="mcnDividerBlockInner" style="padding: 18px;">
                <hr class="mcnDividerContent" style="border-bottom-color:none; border-left-color:none; border-right-color:none; border-bottom-width:0; border-left-width:0; border-right-width:0; margin-top:0; margin-right:0; margin-bottom:0; margin-left:0;" />
-->
</td>
        </tr></tbody></table>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;"><tbody class="mcnTextBlockOuter"><tr>
<td valign="top" class="mcnTextBlockInner" style="padding-top:9px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;">
              	<!--[if mso]>
				<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
				<tr>
				<![endif]-->

				<!--[if mso]>
				<td valign="top" width="600" style="width:600px;">
				<![endif]-->
                <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;" width="100%" class="mcnTextContentContainer"><tbody><tr>
<td valign="top" class="mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;mso-line-height-rule:exactly;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;word-break:break-word;color:#43404D;font-family:Georgia;font-size:12px;line-height:150%;text-align:center;">

                            <span style="font-family:trebuchet ms,lucida grande,lucida sans unicode,lucida sans,tahoma,sans-serif"><em>Copyright &copy; 2020 ${
                              process.env.FRONTEND_TITLE
                            }, All rights reserved.</em><br><br><strong>Our mailing address is:</strong><br>
300 New Jersey Avenue NW, Suite 900, Washington, DC 20001<br><br>
&nbsp;
                        </td>
                    </tr></tbody></table>
<!--[if mso]>
				</td>
				<![endif]--><!--[if mso]>
				</tr>
				</table>
				<![endif]-->
</td>
        </tr></tbody></table>
</td>
										</tr>
</table>
</td>
							</tr>
</table>
<!--[if gte mso 9]>
						</td>
						</tr>
						</table>
						<![endif]--><!-- // END TEMPLATE -->
</td>
                </tr></table>
</center>
    </body>
</html>
`;
