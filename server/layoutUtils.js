module.exports.layout = `<!DOCTYPE html>
<html>
<head>
    <base href="/" />
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, maximum-scale=1.0, minimum-scale=1.0">
    <title>Infrastructure</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
</head>
<body>
    <div>
    {{content}}
    </div>
</body>
{{script}}
</html>`;

module.exports.getBuildHtml = (id, hash, start, end, status, command) =>
	`<tr>
		<th scope="row">
			<a href="/build/${id}">
				${hash}
			</a>
		</th>
		<td>${start}</td>
		<td>${end}</td>
		<td style="${status === 0 ? 'color: green;' : 'color: red;'}">${status}</td>
		<td>${command}</td>
	</tr>`;

module.exports.getTableHtml = tableRows =>
	`<div class="container form-group mb-2 mt-2 form-inline">
		<label for="command-input">Command</label>
		<input id="command" value="npm run build" required type="text" id="command-input" class="form-control mx-sm-4" placeholder="Command">
		<label for="hash-input">Commit hash or Branch name</label>
		<input id="hash" value="master" type="text" id="hash-input" required class="form-control mx-sm-4" placeholder="Commit Hash">
		<button onclick="sendRequest(event)" id="build" class="btn btn-success">Build</button>
	</div>
	<table class="table">
		<thead>
			<tr>
					<th scope="col">Commit hash</th>
					<th scope="col">Start Date</th>
					<th scope="col">End Date</th>
					<th scope="col">Status</th>
					<th scope="col">Build command</th>
			</tr>
		</thead>
		<tbody>${tableRows}</tbody>
	</table>`;

module.exports.getScriptHtml = port =>
	`<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
	<script>
		function sendRequest(event) {
		let command = document.getElementById('command').value;
		let hash = document.getElementById('hash').value;
		event.preventDefault();
		axios.post('http://localhost:${port}/manage_task', {
							hash: hash,
							command: command
					},
					{
							headers:{
									"Accept": "application/json",
									"Access-Control-Allow-Origin": "*",
									"X-Requested-With": "XMLHttpRequest",
									"Access-Control-Allow-Methods" : "GET,POST,PUT,DELETE,OPTIONS",
									"Access-Control-Allow-Headers": "Origin, Content-Type, Access-Control-Allow-Headers, X-Requested-With"
								}
					})
							.then(function (response) {
									console.log(response, 'response');
							})
							.catch(function (error) {
									console.log(error, 'error');
							});
		}
	</script>`;

module.exports.getBuildPageHtml = (id, hash, start, end, status, command, stderr, stdout) =>
	`<table class="table">
		<thead>
			<tr>
					<th scope="col">Commit hash</th>
					<th scope="col">Start Date</th>
					<th scope="col">End Date</th>
					<th scope="col">Status</th>
					<th scope="col">Build command</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th scope="row">
					${hash}
				</th>
				<td>
					${start}
				</td>
				<td>
					${end}
				</td>
				<td style="${status === 0 ? 'color: green;' : 'color: red;'}">${status}</td>
				<td>
					${command}
				</td>
			</tr>
		</tbody>
	</table>
	<div class="m-4">
		<h4 >stderr</h4>
		<div>
			${stderr}
		</div>
	</div>
	<div class="m-4">
	<h4 >stdout</h4>
	<div>
		${stdout}
	</div>
</div>`;
