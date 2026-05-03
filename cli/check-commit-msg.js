#!/usr/bin/env node
import fs from 'fs';

const msgFile = process.argv[2];
const msg = fs.readFileSync(msgFile, 'utf8').trim();

const ticketedPattern = /^KPC-\d{3,4}:(ADD|FIX|DELETE): .+/;
const ticketlessPattern = /^(ADD|FIX|DELETE): .+/;

if (!ticketedPattern.test(msg) && !ticketlessPattern.test(msg)) {
    console.error(`❌ Invalid commit message: "${msg}" \n \n ❌ Required format: KPC-<number: 3-4>:<ADD|FIX|DELETE>: <message> or <ADD|FIX|DELETE>: <message>`);
    process.exit(1);
}

process.exit(0);
