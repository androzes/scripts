'use strict';

const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;
const moment = require('moment-timezone');
const emoji = require('node-emoji');
const { validateEmail, validatePassword } = require('./validators');

const URL = 'https://new.camsonline.com/Investors/Statements/Consolidated-Account-Statement';
const TYPE_DELAY_IN_MS = 80;
const CLICK_DELAY_IN_MS = 0;
const SERVICE_CALL_DELAY_IN_MS = 1000;

exports.handler = async (event) => {
  // returns to date
  return await run(event);
};

const validateInputs = (event) => {
  let {email, password, fromDate, toDate, headless} = event;
    
  if (!validateEmail(email)) {
    exitWithError(new Error(`Invalid Email!`));
  }
   
  //password constraint min 8 char, 1 special char, 1 upper case letter
  // if (!validatePassword(password)) {
  //   exitWithError(new Error(`Invalid Password! Password should contain atleat 8 chars, 1 special char and 1 upper case letter!`));
  // }
  
  let tz = 'Asia/Kolkata'; 

  let timeZoneStr = 'T00:00:00.000+0530';
  if(!fromDate) {
    fromDate = moment('2000-01-01' + timeZoneStr).tz(tz);
  } else if(!moment(fromDate).isValid()) {
    exitWithError(new Error(`Invalid From Date!`));
  } else {
    fromDate = moment(fromDate + timeZoneStr).tz(tz);
  }
  
  
  if(!toDate) {
    toDate = moment(new Date()).tz(tz);
  } else if(!moment(toDate).isValid()) {
    exitWithError(new Error(`Invalid To Date!`));
  } else {
    toDate = moment(toDate + timeZoneStr).tz(tz);
  }
  
  if(moment(fromDate).isAfter(toDate)) {
    exitWithError(new Error(`From Date ${fromDate} cannot be greator than ${toDate}!`));
  }
  
  let fromDateFormatted = fromDate.format('YYYY-MM-DD HH:mm:ss ZZ');
  let toDateFormatted = toDate.format('YYYY-MM-DD HH:mm:ss ZZ');
  fromDate = fromDate.format('DD-MMM-YYYY');
  toDate = toDate.format('DD-MMM-YYYY');
  
  headless = headless == true || headless == 1 || headless == 'true';
  
  console.log(emoji.emojify(`:lock_with_ink_pen: ********* STATEMENT PARAMS ********** :lock_with_ink_pen:`) );
  console.log(`Email: %s`, email);
  console.log(`Password: %s`, password);
  console.log(`From Date: %s`, fromDate);
  console.log(`To Date: %s`, toDate);
  console.log(`headless: %s`, headless);
  console.log(emoji.emojify(`:lock_with_ink_pen: ********* CONFIG ********** :lock_with_ink_pen:`));

  return {email, password, fromDate, toDate, headless, fromDateFormatted, toDateFormatted};
};

const run = async(inputs) => {
  inputs = validateInputs(inputs);
  //return inputs
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: inputs.headless
  });

  console.log("UserAgent: ", await browser.userAgent());
  
  let page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 0 });

  // Accept the cookie dialog
  const radioAcceptSelector = '#mat-radio-2';
  await page.waitForSelector(radioAcceptSelector);
  await page.$eval(radioAcceptSelector, e => e.firstElementChild.click());
  //await radioAcceptButton.click({clickCount:2});
  
  // verify if button is selected
  let isSelected = await page.$eval('#mat-radio-2', e => e.classList.contains('mat-radio-checked'));
  if(!isSelected) {
    throw new Error('Accept radio button not selected.');
  }

  const btnProceedSelector = '#mat-dialog-0 > app-camsterms > div > mat-dialog-content > div.button-row.mt-bottom.text-center > input';
  await page.waitForSelector(btnProceedSelector);
  const btnProceed = await page.$(btnProceedSelector);
  if(btnProceed) {
    btnProceed.click();
    console.log(emoji.emojify(`:pushpin: Cookies Accepted`));
  }
  await page.waitForTimeout(SERVICE_CALL_DELAY_IN_MS);

  // Small hack
  page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'load', timeout: 0 });

  // Statement Type
  const statementTypeRadioDetailedSelector = '#mat-radio-3 > label';
  await page.waitForSelector(statementTypeRadioDetailedSelector);
  const statementTypeRadioDetailed = await page.$(statementTypeRadioDetailedSelector);
  if(statementTypeRadioDetailed) {
    await statementTypeRadioDetailed.click({delay: CLICK_DELAY_IN_MS});
    console.log(emoji.emojify(`:pushpin: Statement Type Selected`));
  }
  await page.waitForTimeout(SERVICE_CALL_DELAY_IN_MS);

  // Period
  const periodRadioSpecificPeriodSelector = '#mat-radio-11 > label';
  await page.waitForSelector(periodRadioSpecificPeriodSelector);
  const periodRadioSpecificPeriod = await page.$(periodRadioSpecificPeriodSelector);
  if(periodRadioSpecificPeriod) {
    await periodRadioSpecificPeriod.click({delay: CLICK_DELAY_IN_MS});
    console.log(emoji.emojify(`:pushpin: Period Selected`));
  }

  // Select FromDate
  const fromDateSelector = '#mat-input-5';
  await page.waitForSelector(fromDateSelector);
  await page.focus(fromDateSelector);
  await page.$eval(fromDateSelector, (e) => {
    e.removeAttribute('readonly');
    e.value = '';
  });
  const datePickerFromDate = await page.$(fromDateSelector);
  if(datePickerFromDate) {
    await datePickerFromDate.click({ clickCount: 2 });
    await page.keyboard.type(inputs.fromDate, {delay:TYPE_DELAY_IN_MS});
    console.log(emoji.emojify(`:pushpin: From Date Selected`));
  }
  

  // Select ToDate
  const toDateSelector = '#mat-input-6';
  await page.waitForSelector(toDateSelector);
  await page.focus(toDateSelector);
  await page.$eval(toDateSelector, (e) => {
    e.removeAttribute('readonly');
    e.value = '';
  });
  const datePickerToDate = await page.$(toDateSelector);
  if(datePickerToDate) {
    await datePickerToDate.click({ clickCount: 2 });
    await page.keyboard.type(inputs.toDate, {delay:TYPE_DELAY_IN_MS});
    console.log(emoji.emojify(`:pushpin: To Date Selected`));
  }

  // Folio Listing
  const folioListingRadioWithZeroBalancedFolioSelector = '#mat-radio-6 > label';
  await page.waitForSelector(folioListingRadioWithZeroBalancedFolioSelector);
  const folioListingRadioWithZeroBalancedFolio = await page.$(folioListingRadioWithZeroBalancedFolioSelector);
  if(folioListingRadioWithZeroBalancedFolio) {
    await folioListingRadioWithZeroBalancedFolio.click();
    console.log(emoji.emojify(`:pushpin: Folio Listing Selected`));
  }

  // Enter email
  const inputEmailSelector = '#mat-input-0';
  await page.waitForSelector(inputEmailSelector);
  const inputEmail = await page.$(inputEmailSelector);
  if(inputEmail) {
    await inputEmail.click({ clickCount: 2 });
    await page.keyboard.type(inputs.email, {delay:TYPE_DELAY_IN_MS});
    await page.$eval(inputEmailSelector, e => e.blur());
    console.log(emoji.emojify(`:pushpin: Email Entered`));
  }
  
  // This wait is for service call
  await page.waitForTimeout(SERVICE_CALL_DELAY_IN_MS);

  // Enter Password
  const inputPasswordSelector = '#mat-input-2';
  await page.waitForSelector(inputPasswordSelector);
  const inputPassword = await page.$(inputPasswordSelector);
  if(inputPassword) {
    await inputPassword.click({ clickCount: 3 });
    await page.keyboard.type(inputs.password, {delay:TYPE_DELAY_IN_MS});
    console.log(emoji.emojify(`:pushpin: Password Entered`));
  }

  // Enter Confirm Password
  const inputConfirmPasswordSelector = '#mat-input-3';
  await page.waitForSelector(inputConfirmPasswordSelector);
  const inputConfirmPassword= await page.$(inputConfirmPasswordSelector);
  if(inputConfirmPassword) {
    await inputConfirmPassword.click({ clickCount: 3 });
    await page.keyboard.type(inputs.password, {delay:TYPE_DELAY_IN_MS});
    console.log(emoji.emojify(`:pushpin: Confirm Password Entered`));
  }

  // Submit form
  const btnSubmitSelector = 'button[type="submit"]';
  await page.waitForSelector(btnSubmitSelector);
  const btnSubmit = await page.$(btnSubmitSelector);
  if(btnSubmit) {
    await btnSubmit.click();
    console.log(emoji.emojify(`:white_check_mark: *** Form Submitted`));
  }
  await page.waitForTimeout(SERVICE_CALL_DELAY_IN_MS);

  // Verify the success message
  try {
    const successSelector = 'div.success-icon';
    const successIcon = await page.waitForSelector(successSelector, {timeout: 5000});
    const successText = await page.$eval(successSelector, (e) => {return e.firstChild.innerHTML});
  } catch (e) {
    if (e instanceof puppeteer.errors.TimeoutError) {
      throw new Error('Request unsuccessful - No success page');
    }
  }
  
  await keypress();

  console.log(`*** Closing Browser Instance`);
  await browser.close();
  return inputs.toDateFormatted
};


function exitWithError(err) {
  console.log(emoji.emojify(`:x: ${err.message}`));
  throw err;
}

const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}

// when running from command line
// else comment out

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
let {email, password, fromDate, toDate, headless} = argv;

(async () => {
  await run({email, password, fromDate, toDate, headless});
})();