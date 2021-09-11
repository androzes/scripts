'use strict';

const debug = require('debug')('cams');
const puppeteer = require('puppeteer');
const moment = require('moment-timezone');
const emoji = require('node-emoji');

const { validateEmail, validatePassword } = require('./validators');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
let {email, password, fromDate, toDate, headless} = argv;

debug(emoji.emojify(`:smiling_imp: Running in Debug Mode!`));

const URL = 'https://new.camsonline.com/Investors/Statements/Consolidated-Account-Statement';
const INPUT_DELAY_IN_MS = 100;
const SERVICE_CALL_DELAY_IN_MS = 1000;

if (!validateEmail(email)) {
  exitWithError(new Error(`Invalid Email!`));
}
 
//password constraint min 8 char, 1 special char, 1 upper case letter
// if (!validatePassword(password)) {
//   exitWithError(new Error(`Invalid Password! Password should contain atleat 8 chars, 1 special char and 1 upper case letter!`));
// }

if(!fromDate) {
  // Using Since inception for now
  fromDate = new Date('2000-01-01');
} else if(!moment(fromDate).isValid()) {
  exitWithError(new Error(`Invalid From Date!`));
} else {
  fromDate = new Date(fromDate);
}

if(!toDate) {
  // Using Since inception for now
  toDate = new Date()
} else if(!moment(toDate).isValid()) {
  exitWithError(new Error(`Invalid To Date!`));
} else {
  toDate = new Date(toDate);
}

if(moment(fromDate).isAfter(toDate)) {
  exitWithError(new Error(`From Date ${fromDate} cannot be greator than ${toDate}!`));
}

fromDate = moment(fromDate).format('DD-MMM-YYYY');
toDate = moment(toDate).format('DD-MMM-YYYY');

headless = headless == true || headless == 1 || headless == 'true';

debug(emoji.emojify(`:lock_with_ink_pen: ********* STATEMENT PARAMS ********** :lock_with_ink_pen:`) );
debug(`Email: %s`, email);
debug(`Password: %s`, password);
debug(`From Date: %s`, fromDate);
debug(`To Date: %s`, toDate);

debug(emoji.emojify(`:lock_with_ink_pen: ********* CONFIG ********** :lock_with_ink_pen:`));
debug(`headless: %s`, headless);

// exitWithSuccess();

(async () => {

  const browser = await puppeteer.launch({
    headless: headless,
    devtools: !headless
  });
  let page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'load', timeout: 0 });

  // Accept the cookie dialog
  const radioAccept = await page.$('#mat-radio-2');
  if (radioAccept) {
    radioAccept.click();

    const btnProceed = await page.$('#mat-dialog-0 > app-camsterms > div > mat-dialog-content > div.button-row.mt-bottom.text-center > input');
    if(btnProceed) {
      btnProceed.click();
      debug(emoji.emojify(`:pushpin: Cookies Accepted`));
    }
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
    statementTypeRadioDetailed.click();
    debug(emoji.emojify(`:pushpin: Statement Type Selected`));
  }

  // Period
  const periodRadioSpecificPeriodSelector = '#mat-radio-11 > label';
  await page.waitForSelector(periodRadioSpecificPeriodSelector);
  const periodRadioSpecificPeriod = await page.$(periodRadioSpecificPeriodSelector);
  if(periodRadioSpecificPeriod) {
    periodRadioSpecificPeriod.click();
    debug(emoji.emojify(`:pushpin: Period Selected`));
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
    await page.keyboard.type(fromDate, {delay:INPUT_DELAY_IN_MS});
    debug(emoji.emojify(`:pushpin: From Date Selected`));
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
    await page.keyboard.type(toDate, {delay:INPUT_DELAY_IN_MS});
    debug(emoji.emojify(`:pushpin: To Date Selected`));
  }

  // Folio Listing
  const folioListingRadioWithZeroBalancedFolioSelector = '#mat-radio-6 > label';
  await page.waitForSelector(folioListingRadioWithZeroBalancedFolioSelector);
  const folioListingRadioWithZeroBalancedFolio = await page.$(folioListingRadioWithZeroBalancedFolioSelector);
  if(folioListingRadioWithZeroBalancedFolio) {
    folioListingRadioWithZeroBalancedFolio.click();
    debug(emoji.emojify(`:pushpin: Folio Listing Selected`));
  }

  // Enter email
  const inputEmailSelector = '#mat-input-0';
  await page.waitForSelector(inputEmailSelector);
  const inputEmail = await page.$(inputEmailSelector);
  if(inputEmail) {
    await inputEmail.click({ clickCount: 2 });
    await page.keyboard.type(email, {delay:INPUT_DELAY_IN_MS});
    await page.$eval(inputEmailSelector, e => e.blur());
    debug(emoji.emojify(`:pushpin: Email Entered`));
  }
  
  // This wait is for service call
  await page.waitForTimeout(SERVICE_CALL_DELAY_IN_MS);

  // Enter Password
  const inputPasswordSelector = '#mat-input-2';
  await page.waitForSelector(inputPasswordSelector);
  const inputPassword = await page.$(inputPasswordSelector);
  if(inputPassword) {
    await inputPassword.click({ clickCount: 3 });
    await page.keyboard.type(password, {delay:INPUT_DELAY_IN_MS});
    debug(emoji.emojify(`:pushpin: Password Entered`));
  }

  // Enter Confirm Password
  const inputConfirmPasswordSelector = '#mat-input-3';
  await page.waitForSelector(inputConfirmPasswordSelector);
  const inputConfirmPassword= await page.$(inputConfirmPasswordSelector);
  if(inputConfirmPassword) {
    await inputConfirmPassword.click({ clickCount: 3 });
    await page.keyboard.type(password, {delay:INPUT_DELAY_IN_MS});
    debug(emoji.emojify(`:pushpin: Confirm Password Entered`));
  }

  // Submit form
  const btnSubmitSelector = 'button[type="submit"]';
  await page.waitForSelector(btnSubmitSelector);
  const btnSubmit = await page.$(btnSubmitSelector);
  if(btnSubmit) {
    btnSubmit.click();
    console.log(emoji.emojify(`:white_check_mark: *** Form Submitted`));
  }

  // This wait is for service call
  await page.waitForTimeout(SERVICE_CALL_DELAY_IN_MS);

  //debug(`*** Closing Browser Instance`);
  //await browser.close();

  exitWithSuccess();
})();

function exitWithSuccess() {
  console.log(`Done Executing`);
  process.exit(0);
}

function exitWithError(err) {
  console.log(emoji.emojify(`:x: ${err.message}`));
  process.exit(1);
}

const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}