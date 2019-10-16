const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const config = require('../config');
const {
	layout,
	getBuildHtml,
	getTableHtml,
	getScriptHtml,
	getBuildPageHtml
} = require('./layoutUtils');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const app = express();

let agents = [];
let taskQueue = [];

const port = config.serverPort || 3000;
const fileName = config.dataFile || 'data.txt';

app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(cors());

app.get('/', function(request, response) {
	fs.readFile(fileName, 'utf8', function(error, data) {
		let builds = error ? [] : JSON.parse(data);
		let arrayHtml = '';

		builds.forEach(element => {
			arrayHtml += getBuildHtml(
				element.id,
				element.hash,
				element.start,
				element.end,
				element.status,
				element.command
			);
		});

		let content = getTableHtml(arrayHtml);
		let script = getScriptHtml(port);

		response.send(
			layout.replace('{{content}}', content).replace('{{script}}', script)
		);
	});
});

app.get('/build/:buildId', function(request, response) {
	let buildId = request.params['buildId'];
	readFileData(builds => {
		let build = builds.find(el => el.id == buildId);
		let content = getBuildPageHtml(
			build.id,
			build.hash,
			build.start,
			build.end,
			build.status,
			build.command,
			build.stderr,
			build.stdout
		);

		build &&
			response.send(
				layout.replace('{{content}}', content).replace('{{script}}', '')
			);
	});
});

app.post('/manage_task', function(request, response) {
	console.log('/manage_task');
	let responseData = request.body;

	if (!responseData) return response.sendStatus(400);

	let freeAgentIndex = agents.findIndex(el => el.isFree);

	if (freeAgentIndex < 0) {
		taskQueue.push({
			hash: responseData.hash,
			command: responseData.command
		});
		return;
	}

	let agent = agents[freeAgentIndex];

	agents[freeAgentIndex].isFree = false;

	sendTask(agent, responseData);
});

app.post('/notify_agent', function(request, response) {
	console.log('/notify_agent');
	if (!request.body) return response.sendStatus(400);

	let { port, host } = request.body;
	let newAgent;
	let agentIndex = agents.findIndex(el => el.port === port);
	let taskLen = taskQueue.length;

	if (agentIndex < 0) {
		newAgent = { host: host, port: port, isFree: taskLen === 0 };
		agents.push(newAgent);
	} else {
		agents[agentIndex].isFree = taskLen === 0;
		newAgent = agents[agentIndex];
	}

	if (taskQueue.length > 0) {
		let firstTask = taskQueue.shift();

		sendTask(newAgent, firstTask);
	}

	console.log(agents, 'agents');
	response.sendStatus(200);
});

app.post('/notify_build_result', function(request, response) {
	let agentResponse = request.body;
	console.log('/notify_build_result');
	if (!agentResponse) return response.sendStatus(400);

	let { port } = agentResponse;
	let currentAgentIndex = agents.findIndex(el => el.port === port);

	agents[currentAgentIndex].isFree = taskQueue.length === 0;

	if (taskQueue.length > 0) {
		let firstTask = taskQueue.shift();

		sendTask(agents[currentAgentIndex], firstTask);
	}

	readFileData(builds => {
		let allBuilds = [...builds, agentResponse];

		fs.writeFile(fileName, JSON.stringify(allBuilds), function() {
			console.log('writeFile');
		});
	});

	console.log(agents, 'agents');

	response.sendStatus(200);
});

app.listen(port, () => {
	console.log('Server started');
});

const readFileData = cb => {
	fs.readFile(fileName, 'utf8', function(error, data) {
		let builds = error ? [] : JSON.parse(data);

		cb(builds);
	});
};

const sendTask = (agent, responseData) => {
	axios
		.post(
			'http://' + agent.host + ':' + agent.port + '/build',
			{
				hash: responseData.hash,
				command: responseData.command,
				start: new Date().toLocaleString(),
				id: (~~(Math.random() * 1e8)).toString(16)
			},
			{
				headers: {
					Accept: 'application/json',
					'Access-Control-Allow-Origin': '*',
					'X-Requested-With': 'XMLHttpRequest',
					'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
					'Access-Control-Allow-Headers':
						'Origin, Content-Type, Access-Control-Allow-Headers, X-Requested-With'
				}
			}
		)
		.then(function(response) {
			console.log('build response', response);
		})
		.catch(function(error) {
			console.log('build error', error);
		});
};
