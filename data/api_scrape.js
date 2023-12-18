import fetch from 'node-fetch';
import fs from 'fs';
import csv from 'fast-csv';

const startDate  = '2022-04-07';
const endDate = '2022-04-30';

const ws = fs.createWriteStream('./data_202204.csv');
const stream = csv.format();
stream.pipe(ws);
stream.write([ 'API Key', 'Date', 'Year','Home Team', 'Away Team', 'Home Score', 'Away Score', 'Final Score','Winning Team','# Innings', 'End Top Inning?', 'Home Team PA #', 'Away Team PA #', 'Total Number PA', 'Homne Team # Pitches', 'Away Team # Pitches', 'Total # Pitches', 'Home Team Baserunners', 'Away Team Baserunners', 'Total # Baserunners', 'Pitching Changes', 'Time' ]);

const scheduleurl = (startDate, endDate) => "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate="+startDate+"&endDate="+endDate;

const schedule_json = fetch(scheduleurl(startDate,endDate)).then(res => res.json()).then(json => setGamepks(json));

let gamepks = []

function setGamepks(data) {
  console.log(data);
  const gpks = [];
  for (let d = 0; d < data.dates.length; d++) {
    const total = data.dates[d].games.length;
    const games = data.dates[d].games;
    for(let g = 0; g < total; g++) {
      gamepks.push(games[g].gamePk);
    }
  }

  console.log("# Of Games Found: "+gamepks.length)

  for (let i = 0; i < gamepks.length; i++) {
	
	const gameurl = (gamepk) => "https://statsapi.mlb.com/api/v1.1/game/"+gamepks[i]+"/feed/live";
	
	var millisecondsToWait = 1000;
	setTimeout(function() {
	    console.log("Looking at game with ID "+gamepks[i]);
	}, millisecondsToWait);

	const url = gameurl(gamepks[i]);


	fetch(url).then(res => res.json()).then(json => scrapeGameData(json) ).catch(err => console.error(err));
  }
}

function scrapeGameData(data) {
  const game = {}
  game.mlb_api_gamepk = data.gameData.game.pk;
  game.date = data.gameData.datetime.officialDate;
  game.year = game.date.slice(0,4);
  
  game.home_team = data.gameData.teams.home.teamCode.toUpperCase();
  game.away_team = data.gameData.teams.away.teamCode.toUpperCase();
  
    //game.home_team = data.gameData.teams.home.clubName;
  //game.away_team = data.gameData.teams.away.clubName;
  game.home_runs = data.liveData.linescore.teams.home.runs;
  game.away_runs = data.liveData.linescore.teams.away.runs;

  if (game.home_runs > game.away_runs) {
  	game.score = game.home_runs + '-' + game.away_runs
  	game.winning_team = game.home_team
  } else {
  	game.score = game.away_runs + '-' + game.home_runs
  	game.winning_team = game.away_team
  }

  game.num_innings = data.liveData.linescore.currentInning;
  game.end_top_inning = data.liveData.linescore.isTopInning;
  game.home_team_plate_appearances = data.liveData.boxscore.teams.home.teamStats.batting.plateAppearances;
  game.away_team_plate_appearances = data.liveData.boxscore.teams.away.teamStats.batting.plateAppearances;
  game.num_plate_appearances = game.home_team_plate_appearances + game.away_team_plate_appearances;
  game.home_team_pitches = data.liveData.boxscore.teams.home.teamStats.pitching.pitchesThrown;
  game.away_team_pitches = data.liveData.boxscore.teams.away.teamStats.pitching.pitchesThrown;
  game.total_pitches = game.home_team_pitches + game.away_team_pitches;
  game.home_baserunners = data.liveData.boxscore.teams.home.teamStats.batting.hits + data.liveData.boxscore.teams.home.teamStats.batting.hitByPitch + data.liveData.boxscore.teams.home.teamStats.batting.baseOnBalls + data.liveData.boxscore.teams.home.teamStats.batting.intentionalWalks 
  game.away_baserunners = data.liveData.boxscore.teams.away.teamStats.batting.hits + data.liveData.boxscore.teams.away.teamStats.batting.hitByPitch + data.liveData.boxscore.teams.away.teamStats.batting.baseOnBalls + data.liveData.boxscore.teams.away.teamStats.batting.intentionalWalks 
  game.total_baserunners = game.home_baserunners + game.away_baserunners
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
  		// Value ends with a period. Use 'slice' to remove.
  		game.time = game_info[i].value.slice(0,-1);
  	}
  }
  stream.write(Object.values(game))
}
