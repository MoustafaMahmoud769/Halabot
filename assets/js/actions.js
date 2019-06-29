const { ipcRenderer } = require('electron')

ipcRenderer.on('open-dialog-paths-selected-action', (event, arg)=> {
  actions.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-actions', (event, arg)=> {
  actions.handler.update(arg);
})

ipcRenderer.on('send-slots', (event, arg)=> {
  actions.handler.updateSlotsChoices(arg);
})

ipcRenderer.on('action-added', (event, arg)=> {
  document.getElementById("action-warning").innerHTML = '';
  document.getElementById("action-name").value = '';
  document.getElementById("action-examples").value = '';
})

ipcRenderer.on('actions-changed', (event, arg)=> {
  actions.messaging.UpdateTable();
})

allslots = []

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      SendCurrentAction: function(eventName) {
        let actionName = document.getElementById("action-name").value;
        let actionExamples = document.getElementById("action-examples").value;
        let args = {actionName, actionExamples};
        ipcRenderer.send(eventName, args);
      },

      addAction: function() {
        actions.messaging.SendCurrentAction('add-action');
      },

      validateCurrentAction: function() {
        actions.messaging.SendCurrentAction('validate-curr-action');
      },

      UpdateTable: function() {
        ipcRenderer.send('get-actions');
      },

      appendSlotInAction: function() {
        newtext = document.getElementById('slots-in-action').value;
        if (newtext == '')
          return;
        selected = ' {' + newtext + '} ';
        text = document.getElementById('action-examples').value + selected;
        document.getElementById('action-examples').value = text;
        document.getElementById('slots-in-action').value = '';
      },

      init: function() {
        $('#add-action').click( function () {
          actions.messaging.addAction()
        })

        $('#validate-curr-action').click( function () {
          actions.messaging.validateCurrentAction()
        })

        $('#add-slots-in-action').click( function () {
          actions.messaging.appendSlotInAction()
        })

        $('#tab4').click( function() {
          slots.messaging.UpdateTable()
          actions.messaging.UpdateTable()
        })

      }
    };

    actions.handler = {

      loadAction: function() {
        ipcRenderer.send('show-open-dialog-action');
      },

      addHeader: function(tableRef) {
        tableRef.innerHTML = '';
        var header = tableRef.createTHead();
        var row = header.insertRow(0);
        var cell = row.insertCell(0);
        cell.innerHTML = " <b></b>";
        cell = row.insertCell(1);
        cell.innerHTML = " <b></b>";
        cell = row.insertCell(2);
        cell.innerHTML = " <b></b>";
      },

      addRow: function(tableRef, data) {
        // add new row
        let newRow = tableRef.insertRow(-1);
        // action name
        let newCell1 = newRow.insertCell(-1);
        newCell1.innerHTML = data.name
        // update key
        let newCell4 = newRow.insertCell(-1);
        let element4 = document.createElement("input");
        element4.value = "Display/Modify";
        element4.className = "button submit";
        element4.type = "input";
        element4.onclick = function() {
          actions.handler.remove(data.name);
          document.getElementById("action-name").value = data.name;
          let examples_ = ""
          for(let i =0; i<data.examples.length; i++) {
           examples_ += data.examples[i] + '\n';
          }
          document.getElementById("action-examples").value = examples_;
          document.getElementById("action-warning").innerHTML = 'This Action was deleted in order for you to modify it, make sure to re-insert it again if you still need it!';
          jQuery('html,body').animate({scrollTop:0},0);
        };
        newCell4.appendChild(element4);
        // delete key
        let newCell5 = newRow.insertCell(-1);
        let element5 = document.createElement("input");
        element5.value = "Delete";
        element5.className = "button submit";
        element5.type = "input";
        element5.onclick = function() {
          actions.handler.remove(data.name);
        };
        newCell5.appendChild(element5);
      },

      remove: function(name) {
        ipcRenderer.send('remove-action', name);
      },

      addOption: function(selname, name, value) {
        var sel = document.getElementById(selname);
        var opt = document.createElement('option');
        opt.appendChild(document.createTextNode(name));
        opt.value = value;
        sel.appendChild(opt);
      },

      updateSlotsChoices: function(data) {
        storyslots = data;
        var sel = document.getElementById('slots-in-buttons');
        var sel2 = document.getElementById('slots-in-action');
        sel.innerHTML = '';
        sel2.innerHTML = '';
        actions.handler.addOption('slots-in-buttons', 'None', '');
        actions.handler.addOption('slots-in-action', 'None', '');
        if (data.length !== 0) {
          for (let i = 0; i < data.length; i++) {
            actions.handler.addOption('slots-in-buttons', data[i].name, data[i].name);
            actions.handler.addOption('slots-in-action', data[i].name, data[i].name);
          }
        }
      },

      update: function(data) {
        let tableRef = document.getElementById('show-actions');
        actions.handler.addHeader(tableRef);
        for(let i = 0; i < data.length; i++){
          actions.handler.addRow(tableRef, data[i]);
        }
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        if (!paths)
          return;
        ipcRenderer.send('load-action', path[0]);
      },

      init: function() {
        $('#load-action').click( function () {
          actions.handler.loadAction()
        })
      }
    };

    n(function() {
        actions.messaging.init();
        actions.handler.init();
    })

}(jQuery);
