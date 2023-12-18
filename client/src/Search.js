import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import ReactGA from 'react-ga4';
import { Link } from "react-router-dom";

import './App.css';

function Search() {
  const [score, setScore] = useState("1-0");
  const [innings, setInnings] = useState("9");
  const [endTopInning, setEndTopInning] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minPlateAppearances, setMinPlateAppearances] = useState("");
  const [maxPlateAppearances, setMaxPlateAppearances] = useState("");
  const [minPitchingChanges, setMinPitchingChanges] = useState("");
  const [maxPitchingChanges, setMaxPitchingChanges] = useState("");
  const [minPitches, setMinPitches] = useState("");
  const [maxPitches, setMaxPitches] = useState("");
  const [orderBy, setOrderBy] = useState("");

  const [examples, setExamples] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [averageData, setAverageData] = useState("");
  const [yearData, setYearData] = useState("");

  ReactGA.initialize("G-W2RKZ225JE");

  const handleSubmit = (event) => {
    event.preventDefault();

    const findUrl = "/find?score="+score+"&innings="+innings+"&end_top_inning="+endTopInning+"&min_year="+minYear+"&max_year="+maxYear+"&min_plate_appearances="+minPlateAppearances+"&max_plate_appearances="+maxPlateAppearances+"&min_pitching_changes="+minPitchingChanges+"&max_pitching_changes="+maxPitchingChanges+"&min_pitches="+minPitches+"&max_pitches="+maxPitches+"&order_by="+orderBy;
    fetch(findUrl)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
      	console.log("YEAR DATA OF "+JSON.stringify(data.yearData));
        if (data.errorMessage) {
          setErrorMessage(data.errorMessage);
          setExamples(null);
          setYearData(null);
          setAverageData(null);
        } else {
          setExamples(data.examples);
          setYearData(data.yearData);
          setAverageData(data.averageData);
          setErrorMessage(null);
        }
      });
  }

  return (
    <div className="Advanced">
        <h2>Advanced Search</h2>
        <p>Perform an advanced search across our database of every regular-season game from 2014 to 2022. 
        Select the criteria you'd like to filter by, and then submit. You'll see year-by-year aggregated information
        for games matching your filters, as well as a list of example games. 
        </p>
        <Form class="center" onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label><b>Enter Score Of Game (In '#-#' format)</b></Form.Label>
            <Form.Control
              size="sm"
              className="text-center"
              type="text"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label><b>Enter # Of Innings In Game</b></Form.Label>
            <Form.Control
              size="sm"
              className="text-center"
              type="text"
              value={innings}
              onChange={(e) => setInnings(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label><b>Did Game End After Top Half Of Inning?</b></Form.Label>
            <Form.Select
              size="sm"
              className="text-center"
              type="select"
              value={endTopInning}
              onChange={(e) => setEndTopInning(e.target.value)}>
              <option value=""></option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </Form.Select>
          </Form.Group>
          <span>Year</span>
          <div class="pair">
	          <Form.Group>
	            <Form.Label>Earliest</Form.Label>
	            <Form.Select
	              size="sm"
	              className="text-center"
	              type="select"
	              value={minYear}
	              onChange={(e) => setMinYear(e.target.value)}>
	              <option value=""></option>
	              <option value="2014">2014</option>
	              <option value="2015">2015</option>
	              <option value="2016">2016</option>
	              <option value="2017">2017</option>
	              <option value="2018">2018</option>
	              <option value="2019">2019</option>
	              <option value="2020">2020</option>
	              <option value="2021">2021</option>
	              <option value="2022">2022</option>
	            </Form.Select>
	          </Form.Group>
	          <Form.Group>
	            <Form.Label>Latest</Form.Label>
	            <Form.Select
	              size="sm"
	              className="text-center"
	              type="select"
	              value={maxYear}
	              onChange={(e) => setMaxYear(e.target.value)}>
	              <option value=""></option>
	              <option value="2014">2014</option>
	              <option value="2015">2015</option>
	              <option value="2016">2016</option>
	              <option value="2017">2017</option>
	              <option value="2018">2018</option>
	              <option value="2019">2019</option>
	              <option value="2020">2020</option>
	              <option value="2021">2021</option>
	              <option value="2022">2022</option>
	            </Form.Select>
	          </Form.Group>
	      </div>
	      <span># Of Plate Appearances</span>
	      <div class="pair">
	          <Form.Group>
	            <Form.Label>Min</Form.Label>
	            <Form.Control
	              size="sm"
	              className="text-center"
	              type="text"
	              value={minPlateAppearances}
	              onChange={(e) => setMinPlateAppearances(e.target.value)}
	            />
	          </Form.Group>
	          <Form.Group>
	            <Form.Label>Max</Form.Label>
	            <Form.Control
	              size="sm"
	              className="text-center"
	              type="text"
	              value={maxPlateAppearances}
	              onChange={(e) => setMaxPlateAppearances(e.target.value)}
	            />
	          </Form.Group>
	      </div>
	      <span># Of In-Inning Pitching Changes</span>
	      <div class="pair">
	          <Form.Group>
	            <Form.Label>Min</Form.Label>
	            <Form.Control
	              size="sm"
	              className="text-center"
	              type="text"
	              value={minPitchingChanges}
	              onChange={(e) => setMinPitchingChanges(e.target.value)}
	            />
	          </Form.Group>
	          <Form.Group>
	            <Form.Label>Max</Form.Label>
	            <Form.Control
	              size="sm"
	              className="text-center"
	              type="text"
	              value={maxPitchingChanges}
	              onChange={(e) => setMaxPitchingChanges(e.target.value)}
	            />
	          </Form.Group>
	      </div>
	      <span># Of Pitches</span>
	      <div class="pair">
	          <Form.Group>
	            <Form.Label>Min</Form.Label>
	            <Form.Control
	              size="sm"
	              className="text-center"
	              type="text"
	              value={minPitches}
	              onChange={(e) => setMinPitches(e.target.value)}
	            />
	          </Form.Group>
	          <Form.Group>
	            <Form.Label>Max</Form.Label>
	            <Form.Control
	              size="sm"
	              className="text-center"
	              type="text"
	              value={maxPitches}
	              onChange={(e) => setMaxPitches(e.target.value)}
	            />
	          </Form.Group>
	      </div>
          <Form.Group>
            <Form.Label><b>Order Examples By</b></Form.Label>
            <Form.Select
              size="sm"
              className="text-center"
              type="select"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}>
              <option value="date_asc">Date</option>
              <option value="date_desc">Date (Descending)</option>
              <option value="time_asc">Time</option>
              <option value="time_desc">Time (Descending)</option>
              <option value="pa_asc">Plate Appearances</option>
              <option value="pa_desc">Plate Appearances (Descending)</option>
              <option value="pitch_change_asc">In-Inning Pitching Changes</option>
              <option value="pitch_change_desc">In-Inning Pitching Changes (Descending)</option>
              <option value="pitches_asc">Pitches</option>
              <option value="pitches_desc">Pitches (Descending)</option>
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit">
             Search
          </Button>
        </Form>
         {(yearData && averageData) && 
         	<Container fluid="true">
         		<h3>Year-By-Year Breakdown</h3>
	            <Row class="header">
	                <Col>
	                  <b>Year</b>
	                </Col>
	                <Col>
	                  <b># Of Games</b>
	                </Col>
	                <Col>
	                  <b>Avg. Time</b>
	                </Col>
	                <Col>
	                  <b>Min Time</b>
	                </Col>
	                <Col>
	                  <b>Max Time</b>
	                </Col>
	                <Col>
	                  <b>Avg. # Of PAs</b>
	                </Col>
	                <Col>
	                  <b>Avg. # of Pitches</b>
	                </Col>
	            </Row>
	            {yearData.map((year) => (
	              <Row>
	                <Col>
	                  {year.year}
	                </Col>
	                <Col>
	                  {year.count}
	                </Col>
	                <Col>
	                  {year.time}
	                </Col>
	                <Col>
	                  {year.min_time}
	                </Col>
	                <Col>
	                  {year.max_time}
	                </Col>
	                <Col>
	                   {year.plate_appearances}
	                </Col>
	                <Col>
	                  {year.pitches}
	                </Col>
	              </Row>
	            ))}
	            {averageData && 
	              <Row class="average">
	                <Col>
	                  Total
	                </Col>
	                <Col>
	                  {averageData.count}
	                </Col>
	                <Col>
	                  {averageData.time}
	                </Col>
	                <Col>
	                  {averageData.min_time}
	                </Col>
	                <Col>
	                  {averageData.max_time}
	                </Col>
	                <Col>
	                   {averageData.plate_appearances}
	                </Col>
	                <Col>
	                  {averageData.pitches}
	                </Col>
	              </Row>
	            }
	        </Container>
         }
         {examples && 
          <Container fluid="true">
          	<h3>Example Games</h3>
            <Row>
                <Col>
                  <b>Date</b>
                </Col>
                <Col>
                  <b>Game</b>
                </Col>
                <Col>
                  <b>Final Score</b>
                </Col>
                <Col>
                  <b># Innings</b>
                </Col>
                <Col>
                  <b># PAs</b>
                </Col>
                <Col>
                  <b># In-Inning Pitching Changes</b>
                </Col>
                <Col>
                  <b># Total Pitches</b>
                </Col>
                <Col>
                  <b>Time</b>
                </Col>
            </Row>
            {examples.map((example) => (
              <Row>
                <Col>
                  {example.date}
                </Col>
                <Col>
                  {example.game}
                </Col>
                <Col>
                  {example.final_score}
                </Col>
                <Col>
                  {example.innings}
                </Col>
                <Col>
                  {example.plate_appearances}
                </Col>
                <Col>
                   {example.pitching_changes}
                </Col>
                <Col>
                  {example.total_pitches}
                </Col>
                <Col>
                   {example.time}
                </Col>
              </Row>
            ))}
            </Container>
          }
        <Link to="/app">
            Back To Main Page
        </Link>
      
    </div>
  );
}

export default Search;