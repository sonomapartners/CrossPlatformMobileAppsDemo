/// <reference path="Services.js" />
/// <reference path="../knockout-3.3.0.js" />
(function (global) {
    "use strict";

    var clientId = 'INSERT CLIENT ID HERE';
    var redirectUri = 'http://localhost/callback';

    global.ToDoList = global.ToDoList || {};

    function AppViewModel() {
        var self = this;
        self.isAuthenticated = ko.observable(false);
        self.newTaskSubject = ko.observable("");
        self.newTaskDueDays = ko.observable("7");
        self.tasks = ko.observableArray();
        self.isNewTaskFormVisible = ko.observable(false);

        self.showNewTaskForm = function showNewTaskForm() {
            self.newTaskSubject("");
            self.newTaskDueDays("7");
            self.isNewTaskFormVisible(true);
        };

        self.saveNewTask = function saveNewTask() {
            var dueDate = null;
            if (self.newTaskDueDays()) {
                dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + parseInt(self.newTaskDueDays()));
                dueDate = dueDate.toISOString().substr(0, 10);
            }
            var newTask = {
                Subject: self.newTaskSubject(),
                ActivityDate: dueDate
            };
            ToDoList.Services.createRecord('Task', newTask).then(function onTaskCreated(task) {
                self.isNewTaskFormVisible(false);
                newTask.Id = task.id;
                self.tasks.push(newTask);
            });
        };

        self.cancelNewTask = function () {
            self.isNewTaskFormVisible(false);
        };

        self.completeTask = function completeTask(task) {
            ToDoList.Services.updateRecord('Task', task.Id, { Status: 'Completed' }).then(function () {
                self.tasks.remove(task);
            });

            return true;
        };

        self.run = function run() {
            ToDoList.Services.authenticate(clientId, redirectUri)
                .then(function onAuthenticated() {
                    self.isAuthenticated(true);

                    var query =
                        "SELECT Id, Subject, ActivityDate FROM Task WHERE IsClosed=FALSE AND OwnerId='" +
                        ToDoList.Services.getCurrentUserId() +
                        "' ORDER BY ActivityDate";

                    ToDoList.Services.getQueryResults(query, self.tasks);
                });
        }
    };

    global.ToDoList.AppViewModel = AppViewModel;


})(window);