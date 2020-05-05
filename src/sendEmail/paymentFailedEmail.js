export const paymentFailedEmailBody = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Retirement Insider - Credit Card Billing Failure</title>
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700&amp;display=swap" rel="stylesheet">
    <style>
      /* -------------------------------------
          GLOBAL RESETS
      ------------------------------------- */
      img{border:none;-ms-interpolation-mode:bicubic;max-width:100%}body{background-color:#f6f6f6;font-family:Open Sans,sans-serif;-webkit-font-smoothing:antialiased;font-size:14px;line-height:1.4;margin:0;padding:0;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}table{border-collapse:separate;mso-table-lspace:0;mso-table-rspace:0;width:100%}table td{font-family:Open Sans,sans-serif;font-size:14px;vertical-align:top}
      /* -------------------------------------
          BODY & CONTAINER
      ------------------------------------- */
      .body{background-color:#f6f6f6;width:100%}.container{display:block;margin:0 auto!important;max-width:580px;padding:10px;width:580px}.content{box-sizing:border-box;display:block;margin:0 auto;max-width:580px;padding:10px}
      /* -------------------------------------
          HEADER, FOOTER, MAIN
      ------------------------------------- */
      .main{background:#fff;border-radius:3px;width:100%}.wrapper{box-sizing:border-box;padding:20px}.content-block{padding-bottom:10px;padding-top:10px}.footer{clear:both;margin-top:10px;text-align:center;width:100%}.footer a,.footer p,.footer span,.footer td{color:#999;font-size:12px;text-align:center}
      /* -------------------------------------
          TYPOGRAPHY
      ------------------------------------- */
      h1,h2,h3,h4{color:#000;font-family:Open Sans,sans-serif;font-weight:400;line-height:1.4;margin:0;margin-bottom:30px}h1{font-size:35px;font-weight:300;text-align:center;text-transform:capitalize}ol,p,ul{font-family:Open Sans,sans-serif;font-size:16px;font-weight:400;margin:0;margin-bottom:15px}ol li,p li,ul li{list-style-position:inside;margin-left:5px}a{color:#3498db;text-decoration:underline}
      /* -------------------------------------
          BUTTONS
      ------------------------------------- */
      .btn{box-sizing:border-box;width:100%}.btn>tbody>tr>td{padding-bottom:15px}.btn table{width:auto}.btn table td{background-color:#fff;border-radius:5px;text-align:center}.btn a{background-color:#fff;border:solid 1px #3498db;border-radius:5px;box-sizing:border-box;color:#3498db;cursor:pointer;display:inline-block;font-size:16px;margin:0;padding:12px 25px;text-decoration:none}.btn-primary table td{background-color:#323232}.btn-primary a{background-color:#323232;border-color:#323232;color:#fff;letter-spacing:.5px}
      /* -------------------------------------
          OTHER STYLES THAT MIGHT BE USEFUL
      ------------------------------------- */
      .white{color:#fff}.last{margin-bottom:0}.first{margin-top:0}.align-center{text-align:center}.align-right{text-align:right}.align-left{text-align:left}.va-mid{vertical-align:middle}.clear{clear:both}.mt0{margin-top:0}.mt20{margin-top:20px}.mb20{margin-bottom:20px}.mb0{margin-bottom:0}.preheader{color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;width:0}.powered-by a{text-decoration:none}hr{border:0;border-bottom:1px solid #f6f6f6;margin:20px 0}
      /* -------------------------------------
          RESPONSIVE AND MOBILE FRIENDLY STYLES
      ------------------------------------- */
      @media only screen and (max-width:620px){table[class=body] h1{font-size:28px!important;margin-bottom:10px!important}table[class=body] a,table[class=body] ol,table[class=body] p,table[class=body] span,table[class=body] td,table[class=body] ul{font-size:16px!important}table[class=body] .article,table[class=body] .wrapper{padding:10px!important}table[class=body] .content{padding:0!important}table[class=body] .container{padding:0!important;width:100%!important}table[class=body] .main{border-left-width:0!important;border-radius:0!important;border-right-width:0!important}table[class=body] .btn table{width:100%!important}table[class=body] .btn a{width:100%!important}table[class=body] .img-responsive{height:auto!important;max-width:100%!important;width:auto!important}}
      /* -------------------------------------
          PRESERVE THESE STYLES IN THE HEAD
      ------------------------------------- */
      @media all{.ExternalClass{width:100%}.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td{line-height:100%}.apple-link a{color:inherit!important;font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;text-decoration:none!important}#MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}.btn-primary table td:hover{background-color:#666!important}.btn-primary a:hover{background-color:#666!important;border-color:#666!important}}
      /* -------------------------------------
          CUSTOM TERMINAL CSS
      -------------------------------------- */
      .ri-logo {
        font-weight: 600;
        letter-spacing: -2.4px;
        font-family: Open Sans, sans-serif;
        font-size: 32px;
        text-decoration: none !important;
        color: #007bff;
      }
      .ri-icon {
        max-width:45px;
      }
      .blue-divider {
        border-bottom: 1px solid #007bff;
        width:500px;
        margin-bottom:25px;
      }
    </style>
  </head>
  <body class="">
    <span class="preheader">We were unable to process your credit card payment on your Terminal account.</span>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
      <tr>
        <td>&nbsp;</td>
        <td align="center">
          <br/>
          <h1 class="mb0 ri-logo">Retirement Insider</h1>
        </td>
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td class="container">
          <div class="content">

            <!-- START CENTERED WHITE CONTAINER -->
            <table role="presentation" class="main">

              <!-- START HEADER AREA -->
              <tr style="background:linear-gradient(90deg,#4385f3, #225ab7 100%);">
                <td class="wrapper" align="center">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                    <tbody>
                      <tr>
                        <td class="va-mid"><img class="ri-icon" src="https://terminal.retirementinsider.com/img/high-importance-60.png"/></td>
                        <td class="va-mid" align="center"><h3 style="letter-spacing: .5px;" class="white mb0"><b>PAYMENT FAILURE<b></h3></td>
                        <td class="va-mid" align="center"><p class="white mb0">Update your payment details today.</p></td>
                      </tr>
                    </tbody>
                  </table>

                </td>
              </tr>
              <!-- END HEADER AREA -->

              <!-- START MAIN CONTENT AREA -->
              <tr>
                <td class="wrapper">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <h1 class="mb20">Credit Card Billing Failure</h1>
                        <div class="blue-divider"></div>
                        <p>We were unable to process your credit card payment on your Terminal account. </p>
                        <p>To keep enjoying uninterrupted access to Terminal, please update your credit card information.</p>
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary mt20">
                          <tbody>
                            <tr>
                              <td align="center">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                  <tbody>
                                    <tr>
                                      <td> <a href="https://terminal.retirementinsider.com/signin" target="_blank">UPDATE PAYMENT DETAILS</a> </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            <!-- END MAIN CONTENT AREA -->
            </table>
            <!-- END CENTERED WHITE CONTAINER -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main mt20">
              <tr>
                <td class="wrapper" align="center">
                  <h1>Update Your Account</h1>
                  <div><img class="ri-icon" src="https://terminal.retirementinsider.com/img/call-64.png"/></div>
                  <p class="mb0"><b>Online</b></p>
                  <p>Click <a href="https://terminal.retirementinsider.com/signin">here</a> to access your account.</p>
                  <br/>

                  <div><img class="ri-icon" src="https://terminal.retirementinsider.com/img/cursor-50.png"/></div>
                  <p class="mb0"><b>Call</b></p>
                  <p>Call us at (877) 960-0615</p>
                  <br/>

                  <div><img class="ri-icon" src="https://terminal.retirementinsider.com/img/chat-bubble-64.png"/></div>
                  <p class="mb0"><b>Email</b></p>
                  <p><a href="mailto:support@retirementinsider.com">support@retirementinsider.com</a></p>
                  <br/>
                  <div class="blue-divider"></div>
                  <p>
                    If you do not settle this invoice within 14 days of this email, your account may be suspended. Please contact us immediately if you have any questions or concerns regarding this notice.
                  </p>
                  <p>Thank you for choosing Retirement Insider.</p>

                </td>
              </tr>
            </table>

          </div>
        </td>
        <td>&nbsp;</td>
      </tr>
    </table>
  </body>
</html>`
