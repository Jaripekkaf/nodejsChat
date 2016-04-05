/*
Room object to control room stuff and return values.
*/
function Room(name, id, owner) {
  this.name = name;
  this.id = id;
  this.owner = owner;
  this.people = [];
  this.persons = [];
  this.peopleLimit = 4;
  this.status = "available";
  this.private = false;
};

Room.prototype.addPerson = function(personID,personName) {
  if (this.status === "available") {
    this.people.push(personID);
    this.persons.push(personName);
  }
};

Room.prototype.removePerson = function(person) {
  var personIndex = -1;
  for(var i = 0; i < this.people.length; i++){
    if(this.people[i].id === person.id){
      personIndex = i;
      break;
    }
  }
  this.people.remove(personIndex);
};

Room.prototype.getPerson = function(personID) {
  var person = null;
  for(var i = 0; i < this.people.length; i++) {
    if(this.people[i].id == personID) {
      person = this.people[i];
      break;
    }
  }
  return person;
};

Room.prototype.isAvailable = function() {
  return this.available === "available";
};

Room.prototype.isPrivate = function() {
  return this.private;
};

Room.prototype.peopleInRoom = function() {
	return this.persons;
};

module.exports = Room;