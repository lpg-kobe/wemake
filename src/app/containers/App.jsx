import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import ReactGA from 'react-ga';
import { actions as machineActions } from '../flux/machine';
import { actions as keyboardShortcutActions } from '../flux/keyboardShortcut';
import { actions as cncLaserSharedActions } from '../flux/cncLaserShared';
import { actions as laserActions } from '../flux/laser';
// import { actions as cncActions } from '../flux/cnc';
import { actions as printingActions } from '../flux/printing';
import { actions as textActions } from '../flux/text';
import api from '../api';
import Header from './Header';
import Sidebar from './Sidebar';
import Workspace from './Workspace';
import Printing from './Printing';
import Laser from './Laser';
import Cnc from './Cnc';
import Settings from './Settings';
import styles from './App.styl';


class App extends PureComponent {
    static propTypes = {
        ...withRouter.propTypes,
        machineInit: PropTypes.func.isRequired,
        keyboardShortcutInit: PropTypes.func.isRequired,
        functionsInit: PropTypes.func.isRequired,
        initModelsPreviewChecker: PropTypes.func.isRequired,
        laserInit: PropTypes.func.isRequired,
        // cncInit: PropTypes.func.isRequired,
        printingInit: PropTypes.func.isRequired,
        textInit: PropTypes.func.isRequired
    };

    state = {
        platform: 'unknown'
    };

    componentDidMount() {
        // disable select text on document
        document.onselectstart = () => {
            return false;
        };

        const { history } = this.props;

        history.listen(() => {
            this.logPageView();
        });

        // get platform
        api.utils.getPlatform().then(res => {
            const { platform } = res.body;
            this.setState({ platform: platform });
        });

        // init machine module
        this.props.machineInit();
        // init keyboard shortcut
        this.props.keyboardShortcutInit();

        this.props.functionsInit();
        this.props.initModelsPreviewChecker();
        this.props.laserInit();
        // this.props.cncInit();
        this.props.printingInit();
        this.props.textInit();
    }

    logPageView() {
        const path = window.location.pathname + window.location.search + window.location.hash;
        ReactGA.set({ page: path });
        ReactGA.pageview(path);
    }

    render() {
        const { location } = this.props;
        const accepted = ([
            '/workspace',
            '/3dp',
            '/laser',
            '/cnc',
            '/settings',
            '/settings/general',
            '/settings/machine',
            '/settings/config'
        ].indexOf(location.pathname) >= 0);

        if (!accepted) {
            return (
                <Redirect
                    to={{
                        pathname: '/workspace',
                        state: {
                            from: location
                        }
                    }}
                />
            );
        }

        return (
            <div>
                <Header {...this.props} />
                <Sidebar {...this.props} platform={this.state.platform} />
                <div className={styles.main}>
                    <div className={styles.content}>
                        <Workspace
                            {...this.props}
                            style={{
                                display: (location.pathname !== '/workspace') ? 'none' : 'block'
                            }}
                        />

                        {(this.state.platform !== 'unknown' && this.state.platform !== 'win32') && (
                            <Printing
                                {...this.props}
                                hidden={location.pathname !== '/3dp'}
                            />
                        )}

                        <Laser
                            {...this.props}
                            style={{
                                display: (location.pathname !== '/laser') ? 'none' : 'block'
                            }}
                        />

                        <Cnc
                            {...this.props}
                            style={{
                                display: (location.pathname !== '/cnc') ? 'none' : 'block'
                            }}
                        />

                        {location.pathname.indexOf('/settings') === 0 && (
                            <Settings {...this.props} />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        machineInit: () => dispatch(machineActions.init()),
        keyboardShortcutInit: () => dispatch(keyboardShortcutActions.init()),
        laserInit: () => dispatch(laserActions.init()),
        // cncInit: () => dispatch(cncActions.init()),
        printingInit: () => dispatch(printingActions.init()),
        textInit: () => dispatch(textActions.init()),
        functionsInit: () => {
            dispatch(cncLaserSharedActions.initSelectedModelListener('laser'));
            dispatch(cncLaserSharedActions.initSelectedModelListener('cnc'));
        },
        initModelsPreviewChecker: () => {
            dispatch(cncLaserSharedActions.initModelsPreviewChecker('laser'));
            dispatch(cncLaserSharedActions.initModelsPreviewChecker('cnc'));
        }
    };
};

export default withRouter(connect(null, mapDispatchToProps)(App));
