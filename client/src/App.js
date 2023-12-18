import { Routes, Route } from 'react-router-dom';
import Match from './Match';
import Search from './Search';

function App() {

  return (
    
    <Routes>
        <Route path='/' element={<Match/>}/>
        <Route path='/advanced' element={<Search/>} />
    </Routes>
  );
}

export default App;
