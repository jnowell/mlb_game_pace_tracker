import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.css';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import ReactGA from 'react-ga4';
import { Link } from "react-router-dom";

import './App.css';


function Match() {
  // Set date to yesterday by default
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [date, setDate] = useState(yesterday.toISOString().slice(0, 10));

  const [team, setTeam] = useState("");
  const [oldGameData, setOldGameData] = useState("");
  const [newGameData, setNewGameData] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [averageData, setAverageData] = useState("");

  ReactGA.initialize("G-W2RKZ225JE");

  const handleSubmit = (event) => {
    event.preventDefault();

    const url = (team, date) => "/search?team="+team+"&date="+date;
    const searchUrl = url(team, date);
    fetch(searchUrl)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data.errorMessage) {
          setErrorMessage(data.errorMessage);
          setOldGameData(null);
          setNewGameData(null);
          setAverageData(null);
        } else {
          setOldGameData(data.oldGame);
          setNewGameData(data.newGame);
          setAverageData(data.averageData);
          setErrorMessage(null);
        }
      });
  }

  return (
    <div className="Match">
    <body>
        <h2>How It Works</h2>
        <p>This is a simple web application designed to test the impact of 2023 MLB rule changes regarding pace of play. Find a game from this season,
         and the system will search the MLB API for a similar game from 2014-2022. The system will look at attributes of each game such as the score, the 
         number of innings, the total number of plate appearances, and the total pitch count, to find the most similar game in our database.
        </p>
        <Form class="center" onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Enter Date Of Game (In YYYY-MM-DD format)</Form.Label>
            <Form.Control
              size="sm"
              className="text-center"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Select One Of The Teams That Played In The Game</Form.Label>
            <Form.Select
              size="sm"
              className="text-center"
              type="select"
              name={team}
              onChange={(e) => setTeam(e.target.value)}
            ><option value="Arizona Diamondbacks">Arizona Diamondbacks</option>
              <option value="Atlanta Braves">Atlanta Braves</option>
              <option value="Baltimore Orioles">Baltimore Orioles</option>
              <option value="Boston Red Sox">Boston Red Sox</option>
              <option value="Chicago Cubs">Chicago Cubs</option>
              <option value="Chicago White Sox">Chicago White Sox</option>
              <option value="Cincinnati Reds">Cincinnati Reds</option>
              <option value="Cleveland Guardians">Cleveland Guardians</option>
              <option value="Colorado Rockies">Colorado Rockies</option>
              <option value="Detroit Tigers">Detroit Tigers</option>
              <option value="Houston Astros">Houston Astros</option>
              <option value="Kansas City Royals">Kansas City Royals</option>
              <option value="Los Angeles Angels">Los Angeles Angels</option>
              <option value="Los Angeles Dodgers">Los Angeles Dodgers</option>
              <option value="Miami Marlins">Miami Marlins</option>
              <option value="Milwaukee Brewers">Milwaukee Brewers</option>
              <option value="Minnesota Twins">Minnesota Twins</option>
              <option value="New York Mets">New York Mets</option>
              <option value="New York Yankees">New York Yankees </option>
              <option value="Oakland Athletics">Oakland Athletics</option>
              <option value="Philadelphia Phillies">Philadelphia Phillies</option>
              <option value="Pittsburgh Pirates">Pittsburgh Pirates</option>
              <option value="San Diego Padres">San Diego Padres</option>
              <option value="San Francisco Giants">San Francisco Giants</option>
              <option value="Seattle Mariners">Seattle Mariners</option>
              <option value="St. Louis Cardinals">St. Louis Cardinals</option>
              <option value="Tampa Bay Rays">Tampa Bay Rays</option>
              <option value="Texas Rangers">Texas Rangers</option>
              <option value="Toronto Blue Jays">Toronto Blue Jays</option>
              <option value="Washington Nationals">Washington Nationals</option>
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
        {errorMessage && 
          <p>{errorMessage}</p>
        }
        {(oldGameData && newGameData) && 
          <Container>
            <Row>
              <Col>
                <Card>
                  <Card.Header><b>Current Game</b></Card.Header>
                  <ListGroup variant="flush">
                    <ListGroup.Item><b>Matchup:</b> {newGameData.away_team} at {newGameData.home_team}</ListGroup.Item>
                    <ListGroup.Item><b>Time:</b> {newGameData.time}</ListGroup.Item>
                    <ListGroup.Item><b>Date:</b> {newGameData.date}</ListGroup.Item>
                    <ListGroup.Item><b>Final Score:</b> {newGameData.score} {newGameData.winning_team}</ListGroup.Item>
                    <ListGroup.Item><b># Innings:</b> {newGameData.num_innings}</ListGroup.Item>
                    <ListGroup.Item><b>Total Plate Appearances:</b> {newGameData.num_plate_appearances}</ListGroup.Item>
                    <ListGroup.Item><b>Total In-Inning Pitching Changes:</b> {newGameData.pitching_changes}</ListGroup.Item>
                    <ListGroup.Item><b>Total Pitches:</b> {newGameData.total_pitches}</ListGroup.Item>
                  </ListGroup>
                </Card>
              </Col>
              <Col>
                <Card>
                  <Card.Header><b>Past Game</b></Card.Header>
                  <ListGroup variant="flush">
                    <ListGroup.Item><b>Matchup:</b> {oldGameData.away_team} at {oldGameData.home_team}</ListGroup.Item>
                    <ListGroup.Item><b>Time:</b> {oldGameData.time}</ListGroup.Item>
                    <ListGroup.Item><b>Date:</b> {oldGameData.date}</ListGroup.Item>
                    <ListGroup.Item><b>Final Score:</b> {oldGameData.score} {oldGameData.winning_team}</ListGroup.Item>
                    <ListGroup.Item><b># Innings:</b> {oldGameData.num_innings}</ListGroup.Item>
                    <ListGroup.Item><b>Total Plate Appearances:</b> {oldGameData.num_plate_appearances}</ListGroup.Item>
                    <ListGroup.Item><b>Total In-Inning Pitching Changes:</b> {oldGameData.pitching_changes}</ListGroup.Item>
                    <ListGroup.Item><b>Total Pitches:</b> {oldGameData.total_pitches}</ListGroup.Item>
                  </ListGroup>
                </Card>
              </Col>
            </Row>
          </Container>
        }
        {averageData &&
          <p>Between 2014 and 2022, there were <b>{averageData.count}</b> games with a score of <b>{averageData.score}</b> that 
            lasted <b>{averageData.innings}</b> innings. The average length of these games was <b>{averageData.time}</b>. These games
            averaged <b>{averageData.plate_appearances}</b> plate appearances and <b>{averageData.pitches}</b> total pitches. The shortest
            game took <b>{averageData.min_time}</b> and the longest game took <b>{averageData.max_time}</b>.</p>
        } 
        <p>Curious to see more? Use our <Link to="/advanced">Advanced Search</Link> feature to explore our database.</p>
      </body>
      </div>
  );
}

export default Match;
