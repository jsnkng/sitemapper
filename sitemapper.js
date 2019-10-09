#!/usr/bin/env node

const program = require('commander');
const { prompt } = require('inquirer'); 
const { crawl } = require('./crawl');

// Craft questions to present to users
const questions = [
  {
    type : 'input',
    name : 'startURL',
    message : 'Enter start URL ...',
    default : 'https://www.cab408.com'
  },
  {
    type : 'input',
    name : 'maxPages',
    message : 'Enter maximum number of pages ...',
    default : 10
  }
];

program
  .version('0.0.1')
  .description('Site Map Generator');

program
  .command('crawl')
  .alias('c')
  .description('Generate a Site Map')
  .action(() => {
    prompt(questions).then(answers =>
      crawl.init(answers.startURL, answers.maxPages));
  });

program.parse(process.argv);