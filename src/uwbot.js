var http = require("http");
var key = "59936cbc7642729f6f519c130c530bdd";
var baseUrl = "api.uwaterloo.ca";

function process (command, callback) {
  //command format should be "@uwbot <commands> <parameters>"
  /**
   * Commands accepted:
   * weather
   * holiday
   * food
   * exam
   * tutors
   * help
   * disclaimer
   **/
  try {
    var i = command.indexOf(" ");
    var args;
    var str;
    if(i == -1) {
      args = str = "";
    }
    else {
      // space delimited args
      args = command.split(" ");

      // the entire string after the '@botname ', is empty string unless '@botname ' is followed by one or more chars
      str = i == -1 ? "" : command.substr(i + 1);
    }

    switch(args[1]) {
      case "course":
        if (args.length == 4) {
          getCourseSchedule(args[2], args[3], function (data) {
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case "weather":
        if(args.length == 2) {
          getWeather(function (data) {
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case "holiday":
        if(args.length == 2) {
          getNextHoliday(function (data) {
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case "food":
        if(args.length == 2) {
          getFood(function (data) {
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case "exam":
        if(args.length == 4) {
          getExamSchedule(args[2], args[3], function (data) {
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case "number":
        if(args.length == 3 && parseInt(args[2]) == args[2]) {
          getNumberTrivia(args[2], function (data) {
            callback(data);
          })
        }
        break;
      case "infoses":
        var index = str.indexOf(" ");
        var arg = (index == -1) ? "" : str.substr(index + 1);
        getInfoSession(arg, function (data) {
          callback(data);
        });
        break;
      case "courseinfo":
        if(args.length == 4) {
          getCourseInfo(args[2], args[3], function (data) { 
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case "tutors":
        if(args.length == 4) {
          getTutors(args[2], args[3], function (data) { 
            callback(data);
          });
        }
        else {
          callback(returnHelpString());
        }
        break;
      case undefined:
      case "help":
        callback("Address bot with <b>@uwbot</b> or <b>@bot</b> (command) (options) <br> \
          <b>UWBot commands:</b> <br> \
            <b>course</b>: [subject] (course_number) Get the schedule of a course in the current term.<br> \
            <b>courseinfo</b> [subject] (course_number): Get a brief description of the course, prereqs and antireqs <br> \
            <b>exam</b> [subject] (course_number): Get the exam info for a given subject <br> \
            <b>tutors</b> [subject] (course_number): Get a list of tutors for this course, if any <br> \
            <b>infoses</b> (\"today\"/company_name): Get today's employer's info sessions or a specific company's info sessions <br> \
            <b>holiday</b>: Get the date of the next holiday! <br> \
            <b>food</b>: Get a list of currently open Food Services locations <br> \
            <b>number</b> (number): Get an 'interesting' fact about the given number <br> \
            <b>weather</b>: Get the current weather in Waterloo <br> \
            <b>disclaimer</b>: Print a boring disclaimer <br> \
            <b>help</b>: Print this help command <br>");
        break;
      case "disclaimer":
        callback("All information from api.uwaterloo.ca, the author provides no guarantees to its correctness.");
        break;
      default:
        callback(returnHelpString());
        break;
    }
  } catch (err) {
    console.log("UWBot has encountered an error: " + err);
    callback("Uh-oh! Something has gone wrong! Please try again later!");
  }
}

function returnHelpString() {
  return "Unrecognized/improperly used command, please refer to '@bot help' for accepted commands and how to use them.";
}

function getNumberTrivia(number, callback) {
  var found = false;
  var lst = ["trivia", "year", "math"];
  var count = 0; //the number of lst elements we've processed
  lst.map(function (str) {
    var url = "/" + parseInt(number) + "/" + str;
    //override baseUrl value
    sendReq("numbersapi.com", url, function (response) {
      count++;
      if(!found && response.found) {
        found = true;
        callback(response.text);
      }
      //if we're at the last element and still haven't found anything
      else if (!found && !response.found && count === lst.length) {
        callback("Cannot find a factoid about " + parseInt(number));
      }
    });
  });
}

function getNextHoliday(callback) {
  var url = "/v2/events/holidays.json";
  sendReq(baseUrl, url, function (response) {
    if(response.meta.status == 200) {
      var holiday;
      var date = new Date();
      for (index in response.data) {
        if(new Date(response.data[index].date) > date) {
          holiday = response.data[index];
          break;
        }
      }
      if(typeof holiday !== "undefined") {
        callback("The next holiday is " + holiday.name + " on " + holiday.date + ". Yay!");
      }
    }
    else {
      callback("Cannot find the next holiday, maybe there is none... :(");
    }
  });
}

function getCurrentTerm(callback) {
  var url = "/v2/terms/list.json" + "?key=" + key;
  sendReq(baseUrl, url, function (response) {
    if(response.meta.status == 200) {
      callback(response.data.current_term);
    }
  });
}

function getExamSchedule(subj, num, callback) {
  var url = "/v2/courses/" + subj + "/" + num + "/examschedule.json" + "?key=" + key;
  var responseStr;
  sendReq(baseUrl, url, function (response) {
    if(response.meta.status == 200 && typeof response.data.course !== "undefined") {
      responseStr = "Exam Info for " + response.data.course + ": <br>";
      for(section in response.data.sections) {
        responseStr += "Section: " + response.data.section.section + "<br> \
        Date: " + response.data.section.date + "<br> \
        Start Time: " + response.data.section.start_time + "<br> \
        End Time: " + response.data.section.end_time + "<br> \
        Location: " + response.data.section.location + "<br> \
        ";
      }
    }
    else {
      responseStr = "Cannot find exam information for '" + subj + num + "'! Exam schedule is not up or no exams for this course ;)";
    }
    callback(responseStr);
  });
}

function getWeather(callback) {
  var url = "/v2/weather/current.json";
  var responseStr;
  sendReq(baseUrl, url, function (response) {
    if(response.meta.status == 200 && response.data.temperature_current_c != null) {
      responseStr = "The current temperature in Waterloo is: " + response.data.temperature_current_c + " Celsius";
      callback(responseStr);
    }
    else {
      callback("Cannot get weather info for Waterloo...");
    }
  });
}

function getFood(callback) {
  var url ="/v2/foodservices/locations.json" + "?key=" + key;
  sendReq(baseUrl, url, function (response) {
    if (response.meta.status == 200) {
      var responseStr = "";
      for (var i = 0; i < response.data.length; i++) {
        if (response.data[i].is_open_now == true) {
          responseStr += "\n" + response.data[i].outlet_name;
        }
      }
      if (responseStr.length == 0) {
        callback("There are no Food Services locations open right now");
      }
      else {
        callback("Open right now:" + responseStr);
      }
    }
    else {
      callback("Food Services data is not available at the moment...");
    }
  });
}

function getInfoSession(option, callback) {
  var url = "/v2/resources/infosessions.json" + "?key=" + key;
  sendReq(baseUrl, url, function (response) {
    if (response.meta.status == 200) {
      if (typeof option !== "undefined") {
        option = option.trim(); //deletes white space and trims user input
      }
      if (typeof option === "undefined" || option == "today" || option == "") { //get today's info sessions
        //get today's date
        var today = new Date();
        var date = today.getDate();
        var month = today.getMonth() + 1; //January is 0!
        
        //record relevant responses into results
        var results = [];
        for (var i = 0; i < response.data.length; i++) {
          //parse response's date field
          var response_data = new Date(response.data[i].date);
          var response_date = response_data.getDate();
          var response_month = response_data.getMonth() + 1;
          if (response_month == month) {
            if (response_date == date) {
              results.push(i);
            } else if (response_date > date) {
              break;
            }
          }
        }
        
        //process results
        if (results.length == 0) {
          var responseStr = "There are no employer's info sessions today.";
          callback(responseStr);
        } else {
          var responseStr = "Today's employer's info session(s):\n";
          for (var i = 0; i < results.length; i++) {
            responseStr += response.data[results[i]].employer + " - " + response.data[results[i]].date + " from " + response.data[results[i]].start_time 
              + " to " + response.data[results[i]].end_time + " at " + response.data[results[i]].location + "\n";
          }
          callback(responseStr);
        }
      } else {  //get the specified company's info sessions
        //record relevant responses into results
        var results = [];
        var lowercase_option = option.toLowerCase();  //compare user's input and the response using lowercase letters
        var now = new Date(); //get current time
        now.setDate(now.getDate() - 1); //take today into account so today's info sessions would be shown
        for (var i = 0; i < response.data.length; i++) {
          if (response.data[i].employer.toLowerCase().indexOf(lowercase_option) != -1 && new Date(response.data[i].date) > now) {
            results.push(i);
          }
        }
        
        //process results
        if (results.length == 0) {
          var responseStr = "There are no upcoming employer's info sessions for company \"" + option + "\".";
          callback(responseStr);
        } else {
          var responseStr = "The upcoming employer's info sessions for company name containing \"" + option + "\" are:\n";
          for (var i = 0; i < results.length; i++) {
            responseStr += response.data[results[i]].employer + " - " + response.data[results[i]].date + " from " + response.data[results[i]].start_time 
              + " to " + response.data[results[i]].end_time + " at " + response.data[results[i]].location + "\n";
          }
          callback(responseStr);
        }
      }
    } else {
      callback("Info Session data is not available at the moment...");
    }
  });
}

function getCourseInfo(subject, num, callback) {
  var url = "/v2/courses/" + subject + "/" + num + ".json" + "?key=" + key;
  var responseStr;
  var termsOfferedStr = "";
  var descriptionStr, prereqStr, antireqStr;
  sendReq(baseUrl, url, function (response) {
    if(response.meta.status == 200) {
      for (var i = 0; i < response.data.terms_offered.length; i++) {
        termsOfferedStr += response.data.terms_offered[i] + " ";
      }
      prereqStr = (response.data.prerequisites !== null) ? response.data.prerequisites : "None";
      antireqStr = (response.data.antirequisites !== null) ? response.data.antirequisites : "None";
      descriptionStr = (response.data.description !== null) ? response.data.description : "No description available for " + subject + num;
      termsOfferedStr = (termsOfferedStr !== "") ? termsOfferedStr : "None";
      responseStr = "<b>" + response.data.title + "</b> \n"
                  + descriptionStr + "\n" 
                  + "Prereqs: " + prereqStr + "\n"
                  + "Antireqs: " + antireqStr + "\n"
                  + "Terms offered: " + termsOfferedStr;
      callback(responseStr);
    }
    else {
      callback("Cannot find course info for " + subject + num + ", please make sure both the subject and course number are correct");
    }
  });
}

function getTutors(subj, num, callback) {
  var url = "/v2/resources/tutors.json?key=" + key;
  var responseStr;
  var found = false;  //indicator variable. 0 == not found, 1 == found.
  
  subj = subj.toUpperCase(); //UW API only uses upper case letters for subjects
    
  sendReq(baseUrl, url, function (response) {
    if (response.meta.status == 200 && response.data.subject !== "undefined") {
      for (var i = 0 ; i < response.data.length ; i++) {
        var response_subject = response.data[i].subject;
        var response_number = response.data[i].catalog_number;
        var response_title = response.data[i].title;
        var response_count = response.data[i].tutors_count;
        var response_url = response.data[i].contact_url;

        if (response_subject == subj && response_number == num) {
          callback("Tutors for " + subj + " " + num + " - " + response_title + ":\nNumber of Tutors: " + response_count
            + "\nContact Info: " + "<a href=\"" + response_url + "\"" + " target=\"_blank\">" + response_url + "</a>");
          found = true;
        }
      }

      if (!found) {
        callback("No tutors for " + subj  + " " + num + " listed. =(");
      }
    }
    else {
      callback("Tutor info is unavailable at the moment... =/");
    }
  });
}

function convertToDays(days) {
  switch (days) {
    case "M":
      return "Mondays";
    case "T":
      return "Tuesdays";
    case "W":
      return "Wednesdays";
    case "Th":
      return "Thursdays";
    case "F":
      return "Fridays";
    case "MW":
      return "Mondays and Wednesdays";
    case "WF":
      return "Wednesdays and Fridays";
    case "MWF":
      return "Mondays, Wednesdays and Fridays";
    case "TTh":
      return "Tuesdays and Thursdays";
    default:
      return days;
  }
}

function getCourseSchedule(subj, num, callback) {
  var url = "/v2/courses/" + subj + "/" + num + "/schedule.json" + "?key=" + key;
  var responseStr;
  sendReq(baseUrl, url, function (response) {
    if(response.meta.status == 200) {
      responseStr = response.data[0].subject + " " + response.data[0].catalog_number + 
        " is offered during the following times: <br>";
      courses = response.data[0]["classes"];
      var responseList = "";

      for (var i = 0 ; i < courses.length ; i++) {
        responseStr += "   " + courses[i].date.start_time + " to " + courses[i].date.end_time + 
          " on " + convertToDays(courses[i].date.weekdays) + "<br>";
      }

    }
    else {
      responseStr = "Cannot find course schedule for '" + subj + num + 
        "'! Course schedule is not up or no such course exists ;)";
    }
    callback(responseStr);
  });
}

function sendReq(baseUrl, url, callback) {
  var options = {
    host: baseUrl,
    port: 80,
    path : url,
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };
  
  var req = http.get(options, function(res) {

  // Buffer the body entirely for processing as a whole.
  var bodyChunks = [];
  res.on('data', function(chunk) {
    // You can process streamed parts here...
    bodyChunks.push(chunk);
  }).on('end', function() {
    var body = Buffer.concat(bodyChunks);
    callback(JSON.parse(body));
  });
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}

module.exports.process = process;
