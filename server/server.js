const express = require('express');
const cors = require('cors');
const path = require('path');
const util = require('util');
const mysql = require('mysql2');

const app = express();

app.use(cors());
//app.use(express.json());

//This will create a middleware.
//When you navigate to the root page, it would use the built react-app
app.use(express.static(path.resolve(path.dirname(__dirname), "client/build")));

const gameurl = (gamePk) => "https://statsapi.mlb.com/api/v1.1/game/"+gamePk+"/feed/live";

// get environment variables for system information
const host = process.env['MYSQL_HOST'];
const username = process.env['MYSQL_USERNAME'];
const password = process.env['MYSQL_PASSWORD'];
const database = process.env['MYSQL_DATABASE'];

/*
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'jnowell',
    password: '*******',
    database: 'mlb_time_tracker'
});
*/

const pool = mysql.createPool({
	host: host,
	user: username,
	password: password,
	database: database
});

let teamMap = new Map([
	['ANA','Angels'], 
	['ARI','D-backs'],
	['ATL','Braves'],      
	['BAL','Orioles'],     
	['BOS','Red Sox'],   
	['CHA','White Sox'],
	['CHN','Cubs'],
	['CIN','Reds'],
	['CLE','Guardians'],
	['COL','Rockies'],
	['DET','Tigers'],
	['HOU','Astros'],
	['KCA','Royals'],
	['LAN','Dodgers'],
	['MIA','Marlins'],
	['MIL','Brewers'],
	['MIN','Twins'],
	['NYA','Yankees'],
	['NYN','Mets'],
	['OAK','Athletics'],
	['PHI','Phillies'],
	['PIT','Pirates'],
	['SDN','Padres'],
	['SEA','Mariners'],
	['SFN','Giants'],
	['SLN','Cardinals'],
	['TBA','Rays'],
	['TEX','Rangers'],
	['TOR','Blue Jays'],
	['WAS','Nationals'] 
]);

app.get('/search', (req, res) => {
	console.log("running search");
	findMatch(req).then(data => {
		if (!('home_runs' in data)) {
			res.json({"errorMessage": "No matching game found on this date"});
			return;
		}

		if (data.status != 'F') {
			console.log("Game hasn't finished yet");
			res.json({"errorMessage": "Game hasn't finished yet. Please wait until game is complete."});
			return;
		}

		if ((data.home_runs == null) || (data.away_runs == null)){
			res.json({"errorMessage": "Full data for this game isn't avaiable via the MLB API yet. Can not find match at this time."});
			return;
		}

		if ((data.num_innings == 9) && (data.total_pitches < 180)) {
			res.json({"errorMessage": "Pitch count data returned from the MLB API does not appear to be accurate. Can not find match at this time."});
			return;
		}

		let newGameData = data;

		let oldGamePk = 0;

		getMatchDatabaseData(data).then(resp => {
			if (!resp) {
				res.json({"errorMessage": "We are experiencing technical difficulties at this time. Please try again later."});
				return;
			}
			if ((resp.averageData.count == 0) || (resp.game_match == 0)) {
		    	res.json({"errorMessage": "No matching game with the same score (and number of innings) was found in our database"});
		    	return;
		    }

		    const oldUrl = gameurl(resp.game_match);
		    fetch(oldUrl)
		    .then(response => {
		      callGameApi(response).then(function(gameData) {
		        oldGameData = gameData;
		        res.json({"newGame": newGameData, "oldGame": oldGameData, "averageData": resp.averageData});
			  });  
		    })
		    .catch(err => {
		      console.log(err);
		    });


		});

	});
    
});

app.get('/find', (req, res) => {
	
	console.log("running find");
	getAdvancedDatabaseData(req).then(resp => {
		if (!resp) {
    	res.json({"errorMessage": "No matching games with the selected criteria score were found in our database"});
    	return;
    }

    res.json({"examples": resp.examples, "yearData": resp.yearData, "averageData": resp.averageData});
	});
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port `+PORT+'.');
});

async function getMatchDatabaseData(data) {
	try {
		const promisePool = pool.promise();

		let avg_query_sql = "SELECT count(*) as count,avg(time_in_minutes) as avg_time, min(time_in_minutes) as min_time, max(time_in_minutes) as max_time,avg(num_plate_appearances) as avg_pa, avg(total_pitches) as avg_pitches"
			+" FROM game_data where"
		    +" score='"+data.score+"'"
		    +" and num_innings="+data.num_innings;
		   	+" and end_top_inning="+data.end_top_inning;

		console.log("Running average query: "+avg_query_sql);

		let [rows, fields] = await promisePool.query(avg_query_sql);

		console.log("RESPONSE OF "+rows);
		const response = {};
		const averageData = {};
		averageData.count = rows[0].count;
		averageData.time = convertTimeToString(Math.round(rows[0].avg_time));
		averageData.min_time = convertTimeToString(Math.round(rows[0].min_time));
		averageData.max_time = convertTimeToString(Math.round(rows[0].max_time));
		averageData.score = data.score;
		if (data.end_top_inning == 1) {
			averageData.innings = data.num_innings - 0.5;
		} else {
			averageData.innings = data.num_innings;
		}
		// Use Math.round to ensure numbers are rounded to nearest tenth
		averageData.plate_appearances = Math.round(rows[0].avg_pa*10)/10;
		averageData.pitches = Math.round(rows[0].avg_pitches*10)/10;
		response.averageData = averageData;
		if (averageData.count == 0) {
			return response;
		}


		let match_sql = "SELECT mlb_api_pk,pitching_changes,num_plate_appearances,total_pitches FROM game_data where"
		        +" score='"+newGameData.score+"'"
		        +" and num_innings="+newGameData.num_innings
		    	+" and end_top_inning="+newGameData.end_top_inning
		    	+" and ABS(total_pitches - "+newGameData.total_pitches + ") <= 20"
		    	+" and ABS(num_plate_appearances - "+newGameData.num_plate_appearances + ") <= 5"
		    	+" and ABS(pitching_changes - "+newGameData.pitching_changes + ") <= 2"
		    	+" ORDER BY ID DESC";

		console.log("Running match query: "+match_sql);

		let [match_rows, match_fields] = await promisePool.query(match_sql);
	    let maxSimilarityScore = 0;
	    let similarityScore = 0;
	    let oldGamePk = 0;
	    for (let i=0; i < match_rows.length; ++i) {
	    	similarityScore = findSimilarityScore(match_rows[i],newGameData);
	    	if (similarityScore > maxSimilarityScore) {
	    		oldGamePk = match_rows[i].mlb_api_pk;
	    		maxSimilarityScore = similarityScore;
	    	}
	    } 

	    response.game_match = oldGamePk;

		return response;
	} catch (err) {
		console.log("ERROR OF "+err);
	}
}

async function getAdvancedDatabaseData(req) {
	try {		
		const promisePool = pool.promise();

		const where_clause = getWhereClause(req);

		const order_by = getOrderByClause(req);

		let examples_query_sql = "SELECT away_team,home_team,score,winning_team,date,num_innings,end_top_inning,pitching_changes,num_plate_appearances,total_pitches,time"
			+" FROM game_data";
		if (where_clause) {
			examples_query_sql += " where "+ where_clause;  
		}
		if (order_by) {
			examples_query_sql += " ORDER BY " + order_by;
		}
		examples_query_sql += " LIMIT 10";
		
		console.log("QUERY SQL OF "+examples_query_sql);

		const response = {};
		examples = [];

		let [example_rows, example_fields] = await promisePool.query(examples_query_sql);

		console.log("example_rows.length of "+example_rows.length);

		if (example_rows.length == 0) {
			return undefined;
		}
		for (let i=0; i < example_rows.length; ++i) {
			example = {};
			score = example_rows[i].score;
			example.date = example_rows[i].date;
			year = example.date.slice(0,4);
			away_team = getTeamFromAbbrev(example_rows[i].away_team,year);
			home_team = getTeamFromAbbrev(example_rows[i].home_team,year);
			winning_team = getTeamFromAbbrev(example_rows[i].winning_team,year);
			
			example.game = away_team + " at " + home_team;
			example.final_score = score + " " + winning_team;
			innings = example_rows[i].num_innings;
			end_top_inning = example_rows[i].end_top_inning;
			if (end_top_inning == 1) {
				example.innings = innings - 0.5;
			} else {
				example.innings = innings;
			}
			example.plate_appearances = example_rows[i].num_plate_appearances;
			example.total_pitches = example_rows[i].total_pitches;
			example.pitching_changes = example_rows[i].pitching_changes;
			example.time = example_rows[i].time.slice(0,4);
			examples.push(example);
		}

		response.examples = examples;

		let avg_query_sql = "SELECT count(*) as count,avg(time_in_minutes) as avg_time, min(time_in_minutes) as min_time, max(time_in_minutes) as max_time,avg(num_plate_appearances) as avg_pa, avg(total_pitches) as avg_pitches";
		avg_query_sql += " from game_data";
		if (where_clause) {
			avg_query_sql += " where "+ where_clause;  
		};

		console.log("AVERAGE QUERY SQL OF "+avg_query_sql);

		let [average_rows, average_fields] = await promisePool.query(avg_query_sql);

		
		const averageData = {};
		averageData.count = average_rows[0].count;
		averageData.time = convertTimeToString(Math.round(average_rows[0].avg_time));
		averageData.min_time = convertTimeToString(Math.round(average_rows[0].min_time));
		averageData.max_time = convertTimeToString(Math.round(average_rows[0].max_time));
		// Use Math.round to ensure numbers are rounded to nearest tenth
		averageData.plate_appearances = Math.round(average_rows[0].avg_pa*10)/10;
		averageData.pitches = Math.round(average_rows[0].avg_pitches*10)/10;
		response.averageData = averageData;
		
		let year_query_sql = "SELECT year,count(*) as count,avg(time_in_minutes) as avg_time, min(time_in_minutes) as min_time, max(time_in_minutes) as max_time,avg(num_plate_appearances) as avg_pa, avg(total_pitches) as avg_pitches";
		year_query_sql += " from game_data";
		if (where_clause) {
			year_query_sql += " where "+ where_clause;  
		};
		year_query_sql += " group by year order by year";

		let [year_rows, year_fields] = await promisePool.query(year_query_sql);

		years = [];

		for (let i=0; i < year_rows.length; ++i) {
			const yearData = {};
			yearData.count = year_rows[i].count;
			yearData.year = year_rows[i].year;
			yearData.time = convertTimeToString(Math.round(year_rows[i].avg_time));
			yearData.min_time = convertTimeToString(Math.round(year_rows[i].min_time));
			yearData.max_time = convertTimeToString(Math.round(year_rows[i].max_time));
			// Use Math.round to ensure numbers are rounded to nearest tenth
			yearData.plate_appearances = Math.round(year_rows[i].avg_pa*10)/10;
			yearData.pitches = Math.round(year_rows[i].avg_pitches*10)/10;
			years.push(yearData);
		}

		response.yearData = years;

		return response;
	} catch (err) {
		console.log("ERROR OF "+err);
	}
}

async function findMatch(req) {
	date = req.query.date;
	team = req.query.team;

	newGameData =  await getNewGameData(date, team);
	return newGameData;
}

async function getNewGameData(date, team) {
	const newGamePk = await getNewGamePk(date, team);
	if (newGamePk == 0) {
		return {};
	}

	const newUrl = gameurl(newGamePk);
	const game_response = await fetch(newUrl);
	let game_response_promise = game_response.json().then(data => {
		return scrapeGameData(data);
	});

	let new_game_data = await game_response_promise;
	return new_game_data;
}

async function getNewGamePk(date, team) {
	const scheduleurl = (date) => "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate="+date+"&endDate="+date;

	const schedule_response = await fetch(scheduleurl(date));
	let schedule_promise = schedule_response.json().then(response => {
		newGamePk = getGamePk(response, team);
		return newGamePk;
	});

	let result = await schedule_promise;
	return result;
}


function getGamePk(scheduleData, team) {
  if (scheduleData.dates) {
	  for (let d = 0; d < scheduleData.dates.length; d++) {
	    const total = scheduleData.dates[d].games.length;
	    const games = scheduleData.dates[d].games;
	    for(let g = 0; g < total; g++) {
	      if ((games[g].teams.home.team.name === team) || (games[g].teams.away.team.name === team)) {
	      	return games[g].gamePk;
	      }
	    }
	  }
  }
  return 0;
}

async function callGameApi(response) {
  const data = await response.json();
  return scrapeGameData(data);
}

function getWhereClause(req) {
	innings = req.query.innings;
	end_top_inning = req.query.end_top_inning;
	score = req.query.score;
	min_year = req.query.min_year;
	max_year = req.query.max_year;
	min_pitches = req.query.min_pitches;
	max_pitches = req.query.max_pitches;
	min_pitching_changes = req.query.min_pitching_changes;
	max_pitching_changes = req.query.max_pitching_changes;
	min_plate_appearances = req.query.min_plate_appearances;
	max_plate_appearances = req.query.max_plate_appearances;

	let where_clause = '';
	if (score) {
		where_clause += "score='"+score+"'";
	}
	if (innings) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "num_innings="+innings;
	}
	if (end_top_inning) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "end_top_inning="+end_top_inning;
	}
	if (min_year) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "year >= "+min_year;
	}
	if (max_year) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "year <= "+max_year;
	}
	if (min_pitches) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "total_pitches >= "+min_pitches;
	}
	if (max_pitches) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "total_pitches <= "+max_pitches;
	}
	if (min_pitching_changes) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "pitching_changes >= "+min_pitching_changes;
	}
	if (max_pitching_changes) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "pitching_changes <= "+max_pitching_changes;
	}
	if (min_plate_appearances) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "num_plate_appearances >= "+min_plate_appearances;
	}
	if (max_plate_appearances) {
		if (where_clause.length > 0) {
			where_clause += " and ";
		}
		where_clause += "num_plate_appearances <= "+max_plate_appearances;
	}
	return where_clause;
}

function getOrderByClause(req) {
	order_by = req.query.order_by;
	//Table is sorted by date, so ordering by ID and date are functionally equivalent
	if (order_by == 'date_asc') {
		return 'id';
	}
	if (order_by == 'date_desc') {
		return 'id desc';
	}
	if (order_by == 'time_asc') {
		return 'time_in_minutes';
	}
	if (order_by == 'date_desc') {
		return 'time_in_minutes desc';
	}
	if (order_by == 'pa_asc') {
		return 'num_plate_appearances';
	}
	if (order_by == 'pa_desc') {
		return 'num_plate_appearances desc';
	}
	if (order_by == 'pitch_change_asc') {
		return 'pitching_changes';
	}
	if (order_by == 'pitch_change_desc') {
		return 'pitching_changes desc';
	}
	if (order_by == 'pitches_asc') {
		return 'total_pitches';
	}
	if (order_by == 'pitches_desc') {
		return 'total_pitches desc';
	}
	return undefined;
}

function findSimilarityScore(result, newGameData) {
  pitch_difference = Math.abs(result.total_pitches-newGameData.total_pitches);
  plate_appearance_difference = Math.abs(result.num_plate_appearances-newGameData.num_plate_appearances);
  pitching_change_difference = Math.abs(result.pitching_changes-newGameData.pitching_changes);
  return 100 - (5*plate_appearance_difference) - (5*pitching_change_difference) - pitch_difference;
}

function getTeamFromAbbrev(abbrev,year) {
	if (year < 2022 && (abbrev == 'CLE')) {
		return 'Indians';
	}
	return teamMap.get(abbrev);
}

function convertTimeToString(time) {
  hours = Math.floor(time/60);
  minutes = (time - hours * 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
  return hours+":"+minutes;
}

function scrapeGameData(data) {
  const game = {}
  game.mlb_api_gamepk = data.gameData.game.pk;
  game.status = data.gameData.status.statusCode;
  game.date = data.gameData.datetime.officialDate;
  game.home_team = data.gameData.teams.home.name;
  game.away_team = data.gameData.teams.away.name;
  game.home_runs = data.liveData.linescore.teams.home.runs;
  game.away_runs = data.liveData.linescore.teams.away.runs;
  if (game.home_runs > game.away_runs) {
  	game.score = game.home_runs + '-' + game.away_runs;
  	game.winning_team = data.gameData.teams.home.clubName;
  } else {
  	game.score = game.away_runs + '-' + game.home_runs;
  	game.winning_team = data.gameData.teams.away.clubName;
  }
  game.num_innings = data.liveData.linescore.currentInning;
  if (data.liveData.linescore.isTopInning == true) {
  	game.end_top_inning = 1;
  } else {
  	game.end_top_inning = 0;
  }
  game.home_team_plate_appearances = data.liveData.boxscore.teams.home.teamStats.batting.plateAppearances;
  game.away_team_plate_appearances = data.liveData.boxscore.teams.away.teamStats.batting.plateAppearances;
  game.num_plate_appearances = game.home_team_plate_appearances + game.away_team_plate_appearances;
  game.home_team_pitches = data.liveData.boxscore.teams.home.teamStats.pitching.pitchesThrown;
  game.away_team_pitches = data.liveData.boxscore.teams.away.teamStats.pitching.pitchesThrown;
  game.total_pitches = game.home_team_pitches + game.away_team_pitches;
  game.home_baserunners = data.liveData.boxscore.teams.home.teamStats.batting.hits + data.liveData.boxscore.teams.home.teamStats.batting.hitByPitch + data.liveData.boxscore.teams.home.teamStats.batting.baseOnBalls + data.liveData.boxscore.teams.home.teamStats.batting.intentionalWalks;
  game.away_baserunners = data.liveData.boxscore.teams.away.teamStats.batting.hits + data.liveData.boxscore.teams.away.teamStats.batting.hitByPitch + data.liveData.boxscore.teams.away.teamStats.batting.baseOnBalls + data.liveData.boxscore.teams.away.teamStats.batting.intentionalWalks; 
  game.total_baserunners = game.home_baserunners + game.away_baserunners;

  let prev_pitcher;
  let prev_half_inning;
  let pitching_changes = 0;
  for (let i=0; i<data.liveData.plays.allPlays.length; ++i) {
  	let half_inning = data.liveData.plays.allPlays[i].about.halfInning;
  	let pitcher = data.liveData.plays.allPlays[i].matchup.pitcher.id;
  	// If pitcher changes but game is still within the same half-inning, consider that an in-inning pitching change
  	if ((i >0) && (prev_half_inning == half_inning) && (prev_pitcher != pitcher)) {
  		pitching_changes++;
  	}
  	prev_pitcher = pitcher;
  	prev_half_inning = half_inning;
  }
  game.pitching_changes = pitching_changes;

  var game_info = data.liveData.boxscore.info;
  for(let i = 0; i < game_info.length; i++) {
  	if (game_info[i].label === 'T') {
  		// Only use the first 4 characters (sometimes API also includes extraneous information)
  		game.time = game_info[i].value.slice(0,4);
  	}
  }
  return game;
}