import {BrowserRouter as Router,useRoutes,Routes,Route} from "react-router-dom";
import './App.css';
import LobbyScreen from './screens/Lobby';
import RoomPage from "./screens/Room";

const App = () => {
  let routes=useRoutes([
    {path:"/", element:<LobbyScreen/>},{path:"/room/:roomId", element:<RoomPage/>},
]);
  return routes;
};

function AppWrapper() {
  return (
    <div className="App">
    <Router>
      <App />
    </Router>
    </div>
  );
}

export default AppWrapper;
