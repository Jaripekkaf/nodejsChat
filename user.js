function User(name,ownerRoomID,inRoomID) {
	this.name = name;
	this.owns = ownerRoomID;
	this.inroom = inRoomID;
}

User.prototype.addUser = function(userId) {
	this.users.push(userId);
};

User.prototype.removeUser = function(userId) {
	var userIndex = -1;
  	for(var i = 0; i < this.users.length; i++){
    	if(this.users[i].id === userId){
      		userIndex = i;
      		break;
		}
	}

	this.people.remove(userIndex);
};

User.prototype.getUser = function(userId) {
	var user = null;
	for(var i= 0; i < this.users.lenght; i++) {
		if(this.users[i].id === userId){
      		user = this.users[i];
      		break;
		}
	}
	return user;
};

module.exports = User;