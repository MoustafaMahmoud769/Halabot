'use strict';
const {Docker} = require('node-docker-api');
const dockerode = require('dockerode');
const tar = require('tar-fs');
const { ipcMain, dialog } = require('electron')
const backend = require('./backend')
const fs = require('fs')
const shell = require('shelljs');

var busyCtr = 0;
var busyMessage;

function preprocess() {
  //launch backend
	node = shell.which('node')
	nodejs = shell.which('nodejs')
	if (node !== null && typeof node === "string")
	{
		shell.config.execPath = node;
	}
	else if (nodejs !== null && typeof nodejs === "string")
	{
		shell.config.execPath = nodejs;
	}
	else if(node !== null && typeof node['stdout'] === "string")
	{
		shell.config.execPath = node['stdout']
	}
	else if (nodejs !== null && typeof nodejs['stdout'] === "string")
	{
		shell.config.execPath = nodejs['stdout']
	}
	else
	{
		dialog.showErrorBox('Oops.. ', 'Can\'t fine node binary in your system');
		return;
	}
	dialog.showMessageBox({
		type: 'info',
		message: 'Running your command!',
		buttons: ['Ok']
	});
}
function acquire_lock(busyMsg) {
  if(busyCtr != 0) {
  	console.log(busyMessage);
	dialog.showErrorBox('Oops.. ', 'Please wait "' + busyMessage + '" currently running.');
  	return false;
  }
  busyCtr = 2;
  busyMessage = busyMsg;
  return true;
}

function free_lock(num) {
	busyCtr -= num;
}
ipcMain.on('validate-my-model', async (event, arg)=> {
	///////////// Used to build and train bot docker image, inside the first then() block, you can know that build has finished
	// const promisifyStream = stream => new Promise((resolve, reject) => {
	//   stream.on('data', data => console.log("data: " + data.toString() + " :/data"))
	//   stream.on('end', resolve)
	//   stream.on('error', reject)
	// });
	//
	// const docker = new Docker({ socketPath: '/var/run/docker.sock' });
	//
	// var tarStream = tar.pack('/Users/marwan/Downloads/rasa-chatbot-master');
	// docker.image.build(tarStream, {
	//   t: 'testbot'
	// })
	// 	.then(stream => promisifyStream(stream))
	// 	.then(() => console.log("BUILT"))
	// 	.then(() => console.log(docker.image.get('testbot').status()))
	// 	.catch(error => console.log(error));

	////////// Used to stop all containers, check for port 5005 until nothing is listening to know that everything was stopped.
	// var drode = new dockerode({socketPath: '/var/run/docker.sock'});
	// drode.listContainers(function (err, containers) {
	//   containers.forEach(function (containerInfo) {
	//     drode.getContainer(containerInfo.Id).stop();
	//   });
	// });

	///////// Used to start the server of the bot, check for port 5005 afterwards to know that it has started
	// drode.run('testbot_1', [], process.stdout, {
	// 	Env : ["PORT=5005", "PYTHONPATH=/app/:$PYTHONPATH"],
	//   ExposedPorts: {
	//     '5005/tcp': {}
	//   },
	//   Hostconfig: {
	//     PortBindings: {
	//       '5005/tcp': [{
	//         HostPort: '5005',
	//       }],
	//     },
	//   },
	// })
	// 	.then(() => console.log("Ran"))
	// 	.catch(error => console.log(error));

  if(!acquire_lock("validation")) {
  	return;
  }
 let errors = backend.full_validation();
	dialog.showMessageBox({
		type: 'info',
		message: 'Your models have ' + errors.length + ' errors!',
		buttons: ['Ok']
	});
	event.sender.send('model-validated', errors);
  free_lock(2);
})

ipcMain.on('start-my-model', (event, arg)=> {
  if(!acquire_lock("starting model")) {
  	return;
  }
  preprocess();
  shell.exec('backend/start_bot.sh SuperDuperBot', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});

	});
  setTimeout(function(){free_lock(1);}, 2000);
  free_lock(1);
})

ipcMain.on('build-my-model', (event, arg)=> {
	if(!acquire_lock("building model")) {
		return;
	}
	//validate & convert data
	data_error_free = backend.full_conversion();
	if(data_error_free === false) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Your models have errors! please fix them first!',
			buttons: ['Ok']
		});
		free_lock(2);
		return;
	}
	//write to backend file
	fs.writeFile("backend/data.json", data_error_free, (err) => {
		if (err) {
			dialog.showErrorBox('Oops.. ', 'Something went wrong');
			free_lock(2);
			return;
		}
	});
	preprocess();
	shell.exec('backend/make_bot.sh SuperDuperBot', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
		free_lock(1);
	});
	free_lock(1);
})

ipcMain.on('stop-my-model', (event, arg)=> {
  if(!acquire_lock("stopping model")) {
  	return;
  }
  preprocess();
  shell.exec('backend/stop_bot.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
		free_lock(1);
	});
  free_lock(1);
})

ipcMain.on('start-example-model', (event, arg)=> {
  if(!acquire_lock("starting example model")) {
  	return;
  }
  preprocess();
  shell.exec('backend/start_bot.sh AR-Trakhees-Demo', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
	});
  setTimeout(function(){free_lock(1);}, 2000);
  free_lock(1);
})

ipcMain.on('stop-example-model', (event, arg)=> {
  if(!acquire_lock("stopping example model")) {
  	return;
  }
  preprocess();
  shell.exec('backend/stop_bot.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
		free_lock(1);
	});
  free_lock(1);
})
