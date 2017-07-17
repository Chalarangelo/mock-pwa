import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// Send a 'GET' request to the specified url and run the callback function when it completes.
function httpGetAsync(url, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open('GET', url, true);
  xmlHttp.send(null);
}

// Get page scroll percentage.
function getScrollPercent() {
  return ((document.documentElement.scrollTop||document.body.scrollTop) / ((document.documentElement.scrollHeight||document.body.scrollHeight) - document.documentElement.clientHeight) * 100);
}

/*
  Store users in an array to make things easier.
  Store posts in an array to make things easier.
  Store a reference to #content-area in a variable for quick access.
  Store a reference to #users-view-button in a variable for quick access.
  Store a reference to #posts-view-button in a variable for quick access.
  Store a reference to #message-area in a variable for quick access.
  Store a reference to #connection-status in a variable for quick access.
  Store the Random User Generator URI we're using in a variable.
  Store the JSON Placeholder URI we're using in a function that auto-increments.
  Store the Unsplash it URI we're using in a variable.
  Store a reference to the timeout set for the #message-area to be able to clear it.
*/
var users = [];
var posts = [];
var contentArea = null;
var usersViewButton = null;
var postsViewButton = null;
var messageArea = null;
var connectionStatus = null
var usersEndpoint = 'https://randomuser.me/api?seed=%22ph%27nglui%20mglw%27nafh%20Cthulhu%20R%27lyeh%20wgah%27nagl%20fhtagn%22&results=25&nat=US';
var postsEndpointCounter = 0;
function postsEndpoint(){
  postsEndpointCounter++;
  return 'https://jsonplaceholder.typicode.com/comments?postId='+postsEndpointCounter;
}
var imagesEndpoint = 'https://unsplash.it/800/800?image=';
var toastHide = null;

// Mode variables to help with state management.
var POSTS_VIEW = 0;
var USERS_VIEW = 1;
var currentView = POSTS_VIEW;

// Function closure, used to get the next post id.
var nextPostId = (function(){
    var postCounter = 0;
    return function () {return postCounter++;}
})();

// Generate a valid random id for an image from the Unsplash It API.
function randomImageId(){
  var invalidIds = [86, 97, 105, 138, 148, 150, 205, 207, 224, 226, 245, 246, 262, 285, 286, 298, 303, 332, 333, 346, 359, 394, 414, 422, 438, 462, 470, 489, 561, 578, 589, 595, 597, 624, 632, 636, 644, 647, 673, 697, 706, 707, 708, 709, 710, 711, 712, 713, 714, 725, 734, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 759, 761, 762, 763, 771, 801, 812, 843, 850, 854, 895, 897, 917, 920, 956, 963];
  var newId = Math.floor(Math.random() * 1000);
  while(invalidIds.indexOf(newId) !== -1)
    newId = Math.floor(Math.random() * 1000);
  return newId;
}

// Generate a random color.
function randomColor(){
  var r = Math.floor(Math.random() * 255).toString(16);
  var g = Math.floor(Math.random() * 255).toString(16);
  var b = Math.floor(Math.random() * 255).toString(16);
  var hex = "#" + (r.length ==  1 ? "0" + r : r) + (g.length ==  1 ? "0" + g : g) + (b.length ==  1 ? "0" + b : b);
  return {
    background: hex,
    color: hex
  };
}

/*
  Application entry point / document has been loaded.
  Get the #content area stored in its respective variable.
  Send a request to the API, process data once the response is received.
*/
document.addEventListener('DOMContentLoaded', function(event) {
  contentArea = document.getElementById('content-area');
  usersViewButton = document.getElementById('users-view-button');
  postsViewButton = document.getElementById('posts-view-button');
  messageArea = document.getElementById('message-area');
  connectionStatus = document.getElementById('connection-status');
  httpGetAsync(usersEndpoint,function(e){
    getUsers(e);
    httpGetAsync(postsEndpoint(),getPosts);
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('service-worker.js')
      .then(function(registration) {
        var worker = registration.installing;
        worker.onstatechange = function(){
          if (worker.state == 'activated'){
            clearTimeout(toastHide);
            ReactDOM.render(<ToastMessage message={'Ready for offline use'} />, messageArea);
            toastHide = window.setTimeout( function() {
              document.getElementById('toast-message').style.opacity = '0';
              ReactDOM.unmountComponentAtNode(messageArea);
            }, 2000);
          }
        }
      });
  }
  usersViewButton.addEventListener('click', function(e){
    if (currentView == USERS_VIEW)
      return;
    currentView = USERS_VIEW;
    httpGetAsync(usersEndpoint, getUsers);
  });
  postsViewButton.addEventListener('click', function(e){
    if (currentView == POSTS_VIEW)
      return;
    currentView = POSTS_VIEW;
    posts = [];
    httpGetAsync(postsEndpoint(),getPosts);
  });
  window.addEventListener('scroll', function(e) {
    if (getScrollPercent() >= 80 && currentView == POSTS_VIEW)   httpGetAsync(postsEndpoint(),getPosts);
  });
  window.addEventListener('resize', function(e) {
    if (getScrollPercent() >= 80 && currentView == POSTS_VIEW)   httpGetAsync(postsEndpoint(),getPosts);
  });
  if (navigator.onLine)
    ReactDOM.render(<SvgWifi />, connectionStatus);
  else
    ReactDOM.render(<SvgWifiOff />, connectionStatus);

  window.addEventListener('load', function() {
    function updateOnlineStatus(event) {
      clearTimeout(toastHide);
      if (navigator.onLine) {
        var message = 'Online';
        ReactDOM.render(<SvgWifi />, connectionStatus);
      }
      else {
        var message = 'Offline';
        ReactDOM.render(<SvgWifiOff />, connectionStatus);
      }
      ReactDOM.render(<ToastMessage message={message} />, messageArea);
      toastHide = window.setTimeout( function() {
        document.getElementById('toast-message').style.opacity = '0';
        ReactDOM.unmountComponentAtNode(messageArea);
      }, 2000);
    }

    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });
});

// Functional component for the Toast message.
function ToastMessage(props){
  if(props.message == 'Online')
    return <span className="toast" id="toast-message" style={{opacity:1}}><SvgWifi />&nbsp;&nbsp;{props.message}&nbsp;</span>;
  else if (props.message == 'Offline')
    return <span className="toast" id="toast-message" style={{opacity:1}}><SvgWifiOff />&nbsp;&nbsp;{props.message}&nbsp;</span>;
  else
    return <span className="toast" id="toast-message" style={{opacity:1}}><SvgCheck />&nbsp;{props.message}&nbsp;</span>;
}

// Store the parsed results to the respective variable and render the users.
function getUsers(data){
  users = JSON.parse(data).results;
  if(currentView == USERS_VIEW)
    renderUsers();
}

// Store the parsed results to the respective variable and render the posts.
function getPosts(data){
  var newPosts = JSON.parse(data);
  for (var key in newPosts){
    posts.push(newPosts[key].body);
  }
  renderPosts();
}

// Functional component for the mail icon.
function SvgMail(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#424242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
}

// Functional component for the calendar icon.
function SvgCalendar(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#424242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
}

// Functional component for the map pin icon.
function SvgMapPin(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#424242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
}

// Functional component for the user icon.
function SvgUser(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#636363" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
}

// Functional component for the check icon.
function SvgCheck(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1de9b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'top'}}><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

// Functional component for the wifi icon.
function SvgWifi(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1de9b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12" y2="20"></line></svg>;
}

// Functional component for the wifi-off icon.
function SvgWifiOff(props){
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12" y2="20"></line></svg>;
}

// Functional component for the user card.
function UserCard(props){
  var user = props.user;
  return <div className="card fluid col-sm-12" id={"user_"+user.login.username}>
    <div className="section row">
      <div className="col-sm-2 col-md-1">
        <img src={user.picture.medium} alt="" className="user-image" />
      </div>
      <div className="col-sm">
        <h4 className="user-name">{user.name.title} {user.name.first} {user.name.last}
          <small>{user.login.username}</small>
        </h4>
      </div>
    </div>
    <div className="section">
      <p className="user-email"> <SvgMail />&nbsp;&nbsp;{user.email}</p>
    </div>
    <div className="section">
      <p className="user-birth"> <SvgCalendar />&nbsp;&nbsp;{user.dob.split(" ")[0].split("-").reverse().join("/")}</p>
    </div>
    <div className="section">
      <p className="user-location"> <SvgMapPin />&nbsp;&nbsp;{user.location.city}, {user.location.state}</p>
    </div>
  </div>;
}

// Functional component for the post card.
function PostCard(props){
  return <div>
    <div className="card fluid" id={"post_"+nextPostId()}>
      <img className="section media" src={props.image} alt="" style={randomColor()}/>
      <div className="section">
        <p className="post-text">{props.text+'.'}</p>
      </div>
      <div className="section">
        <p className="posted-by"> <SvgUser /> &nbsp;&nbsp;Posted by {users[props.userId].login.username}</p>
      </div>
    </div>
  </div>;
}

// Renders a list of users as cards.
function renderUsers(){
  var userCards = users.map(
    function(user, key){
      return <UserCard user={user} key={key}/>;
    }
  );
  ReactDOM.render(
    <div className="row col-md-offset-2 col-lg-offset-3">{userCards}</div>
  ,contentArea);
}

// Render a list of posts as cards.
function renderPosts(){
  var postCards = posts.map(
    function(post, key){
      return <PostCard text={post} userId={Math.floor(Math.random() * 25)} image={imagesEndpoint+randomImageId()}  key={key}/>;
    }
  );
  ReactDOM.render(
    <div className="row col-md-offset-2 col-lg-offset-3">{postCards}</div>
  ,contentArea);
}
