'use strict';

//
// https://web-hooks.tk/
//


// Imports dependencies and set up http server
const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');

// APP CLASSES
const DBHelper = require('./app/db/DBHelper.class').DBHelper;
const Settings = require('./app/Settings.class').Settings;
const Scheduler = require('./app/scheduller/Scheduler.class').Scheduler;
const Bot = require('./app/bot/Bot.class').Bot;
const API = require('./app/api/API.class').API;

const config = require('./defaultconfig');
const mockConfig = require('./mockconfig');
const isDevMode = process.argv[2]==='dev';

// APP OBJECTS
const app = express().use(body_parser.json()); // creates express http server
const settings = new Settings(isDevMode ? mockConfig : config, isDevMode);
const db = new DBHelper(settings);
const scheduler = new Scheduler(db, settings);

scheduler.start();

app.use(cors());
app.listen(process.env.PORT || settings.PORT, () => console.log('webhook is listening. PORT:'+settings.PORT));

// WEB HOOK
const bot = new Bot(app, settings, db, scheduler);
// API
const api = new API(app, settings, db, scheduler);

