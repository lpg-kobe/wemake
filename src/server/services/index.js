import cncengine from './socket-server';
import TaskManager from './task-manager';


function startServices(server) {
    // Start cnc engine
    cncengine.start(server);

    TaskManager.start();
}

export default startServices;
