const d = new Date(2022,2,21)

// Simple format
console.log(new Intl.DateTimeFormat('fa-IR').format(d));
// => ۱۴۰۱/۱/۱

// Full long format
console.log(new Intl.DateTimeFormat('fa-IR', {dateStyle: 'full', timeStyle: 'long'}).format(d));
// => ۱۴۰۱ فروردین ۱, دوشنبه، ساعت ۰:۰۰:۰۰ (‎+۳:۳۰ گرینویچ)

// Latin numbers
console.log(new Intl.DateTimeFormat('fa-IR-u-nu-latn', {dateStyle: 'full', timeStyle: 'long'}).format(d));
// => 1401 فروردین 1, دوشنبه، ساعت 0:00:00 (‎+3:30 گرینویچ)

// English US locale with Persian calendar
console.log(new Intl.DateTimeFormat('en-US-u-ca-persian', {dateStyle: 'full', timeStyle: 'long'}).format(d));
// => Monday, Farvardin 1, 1401 AP at 12:00:00 AM GMT+3:30

// Just year
console.log(new Intl.DateTimeFormat('en-US-u-ca-persian', {year: 'numeric'}).format(d));
// => 1401 AP

// Just month
console.log(new Intl.DateTimeFormat('en-US-u-ca-persian', {month: 'short'}).format(d));
// Farvardin

// Just day
console.log(new Intl.DateTimeFormat('en-US-u-ca-persian', {day: 'numeric'}).format(d));
// => 1