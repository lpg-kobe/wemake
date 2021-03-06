import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import pubsub from 'pubsub-js';
import React, { PureComponent } from 'react';
import jQuery from 'jquery';
import { withRouter } from 'react-router-dom';
import { Button } from '../../components/Buttons';
import Modal from '../../components/Modal';
import api from '../../api';
import controller from '../../lib/controller';
import i18n from '../../lib/i18n';
import store from '../../store';
import DefaultWidgets from './DefaultWidgets';
import PrimaryWidgets from './PrimaryWidgets';
import SecondaryWidgets from './SecondaryWidgets';
import Dropzone from '../../components/Dropzone';
import styles from './index.styl';
import {
    DATA_PREFIX,
    WORKFLOW_STATE_IDLE,
    LASER_GCODE_SUFFIX,
    CNC_GCODE_SUFFIX,
    PRINTING_GCODE_SUFFIX
} from '../../constants';
import modal from '../../lib/modal';
import { actions as workspaceActions } from '../../flux/workspace';

const ACCEPT = `${LASER_GCODE_SUFFIX}, ${CNC_GCODE_SUFFIX}, ${PRINTING_GCODE_SUFFIX}`;

const reloadPage = (forcedReload = true) => {
    // Reload the current page, without using the cache
    window.location.reload(forcedReload);
};

class Workspace extends PureComponent {
    static propTypes = {
        ...withRouter.propTypes
    };

    state = {
        connected: controller.connected,
        isDraggingWidget: false,
        showPrimaryContainer: store.get('workspace.container.primary.show'),
        showSecondaryContainer: store.get('workspace.container.secondary.show')
    };

    sortableGroup = {
        primary: null,
        secondary: null
    };

    primaryContainer = React.createRef();

    secondaryContainer = React.createRef();

    primaryToggler = React.createRef();

    secondaryToggler = React.createRef();

    defaultContainer = React.createRef();

    controllerEvents = {
        'connect': () => {
            this.setState({ connected: controller.connected });
        },
        'disconnect': () => {
            this.setState({ connected: controller.connected });
        }
    };

    widgetEventHandler = {
        onForkWidget: () => {
        },
        onRemoveWidget: () => {
        },
        onDragStart: () => {
            this.setState({ isDraggingWidget: true });
        },
        onDragEnd: () => {
            this.setState({ isDraggingWidget: false });
        }
    };

    actions = {
        onDropAccepted: (file) => {
            // upload then pubsub
            const formData = new FormData();
            formData.append('file', file);
            api.uploadFile(formData).then((res) => {
                const response = res.body;
                const gcodePath = `${DATA_PREFIX}/${response.uploadName}`;
                jQuery.get(gcodePath, (result) => {
                    this.props.clearGcode();
                    this.props.addGcode(file.name, result, 'line');
                });
            }).catch(() => {
                // Ignore error
            });
        },
        onDropRejected: () => {
            const title = i18n._('Warning');
            const body = i18n._('Only G-code files are supported');
            modal({
                title: title,
                body: body
            });
        }
    };

    componentDidMount() {
        this.addControllerEvents();
        this.addResizeEventListener();

        // setTimeout(() => {
        //     A workaround solution to trigger componentDidUpdate on initial render
        // this.setState({ mounted: true });
        // }, 0);
    }

    componentDidUpdate() {
        store.set('workspace.container.primary.show', this.state.showPrimaryContainer);
        store.set('workspace.container.secondary.show', this.state.showSecondaryContainer);

        this.resizeDefaultContainer();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.removeResizeEventListener();
    }

    resizeDefaultContainer = () => {
        const sidebar = document.querySelector('#sidebar');
        const primaryContainer = this.primaryContainer.current;
        const primaryToggler = this.primaryToggler.current;
        const secondaryContainer = this.secondaryContainer.current;
        const secondaryToggler = this.secondaryToggler.current;
        const defaultContainer = this.defaultContainer.current;
        const { showPrimaryContainer, showSecondaryContainer } = this.state;

        { // Mobile-Friendly View
            const { location } = this.props;
            const disableHorizontalScroll = !(showPrimaryContainer && showSecondaryContainer);

            if (location.pathname === '/workspace' && disableHorizontalScroll) {
                // Disable horizontal scroll
                document.body.scrollLeft = 0;
                document.body.style.overflowX = 'hidden';
            } else {
                // Enable horizontal scroll
                document.body.style.overflowX = '';
            }
        }

        if (showPrimaryContainer) {
            defaultContainer.style.left = `${primaryContainer.offsetWidth + sidebar.offsetWidth}px`;
            primaryToggler.style.left = `${primaryContainer.offsetWidth + sidebar.offsetWidth}px`;
        } else {
            defaultContainer.style.left = `${sidebar.offsetWidth}px`;
            primaryToggler.style.left = `${sidebar.offsetWidth}px`;
        }

        if (showSecondaryContainer) {
            defaultContainer.style.right = `${secondaryContainer.offsetWidth}px`;
            secondaryToggler.style.right = `${secondaryContainer.offsetWidth}px`;
        } else {
            defaultContainer.style.right = '0px';
            secondaryToggler.style.right = '0px';
        }

        // Publish a 'resize' event
        pubsub.publish('resize'); // Also see "widgets/Visualizer"
    };

    togglePrimaryContainer = () => {
        const { showPrimaryContainer } = this.state;
        this.setState({ showPrimaryContainer: !showPrimaryContainer });

        // Publish a 'resize' event
        pubsub.publish('resize'); // Also see "widgets/Visualizer"
    };

    toggleSecondaryContainer = () => {
        const { showSecondaryContainer } = this.state;
        this.setState({ showSecondaryContainer: !showSecondaryContainer });

        // Publish a 'resize' event
        pubsub.publish('resize'); // Also see "widgets/Visualizer"
    };

    addResizeEventListener() {
        this.onResizeThrottled = _.throttle(this.resizeDefaultContainer, 50);
        window.addEventListener('resize', this.onResizeThrottled);
    }

    removeResizeEventListener() {
        window.removeEventListener('resize', this.onResizeThrottled);
        this.onResizeThrottled = null;
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.on(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.off(eventName, callback);
        });
    }

    render() {
        const { style, className } = this.props;
        const actions = { ...this.actions };
        const {
            connected,
            isDraggingWidget,
            showPrimaryContainer,
            showSecondaryContainer
        } = this.state;
        const hidePrimaryContainer = !showPrimaryContainer;
        const hideSecondaryContainer = !showSecondaryContainer;

        return (
            <div style={style} className={classNames(className, styles.workspace, this.state.mounted)}>
                {!connected && (
                    <Modal
                        disableOverlay
                        showCloseButton={false}
                    >
                        <Modal.Body>
                            <div style={{ display: 'flex' }}>
                                <i className="fa fa-exclamation-circle fa-4x text-danger" />
                                <div style={{ marginLeft: 25 }}>
                                    <h5>{i18n._('Server has stopped working')}</h5>
                                    <p>{i18n._('A problem caused the server to stop working correctly. Check out the server status and try again.')}</p>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                btnStyle="primary"
                                onClick={reloadPage}
                            >
                                {i18n._('Reload')}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}
                <Dropzone
                    disabled={isDraggingWidget || controller.workflowState !== WORKFLOW_STATE_IDLE}
                    accept={ACCEPT}
                    dragEnterMsg={i18n._('Drop a G-code file here.')}
                    onDropAccepted={actions.onDropAccepted}
                    onDropRejected={actions.onDropRejected}
                >
                    <div className={styles.workspaceTable}>
                        <div className={styles.workspaceTableRow}>
                            <div
                                ref={this.primaryContainer}
                                className={classNames(
                                    styles.primaryContainer,
                                    { [styles.hidden]: hidePrimaryContainer }
                                )}
                            >
                                <PrimaryWidgets
                                    onForkWidget={this.widgetEventHandler.onForkWidget}
                                    onRemoveWidget={this.widgetEventHandler.onRemoveWidget}
                                    onDragStart={this.widgetEventHandler.onDragStart}
                                    onDragEnd={this.widgetEventHandler.onDragEnd}
                                />
                            </div>

                            <div
                                ref={this.primaryToggler}
                                className={classNames(styles.primaryToggler)}
                            >
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={this.togglePrimaryContainer}
                                >
                                    {!hidePrimaryContainer && (
                                        <i className="fa fa-chevron-left" style={{ verticalAlign: 'middle' }} />
                                    )}
                                    {hidePrimaryContainer && (
                                        <i className="fa fa-chevron-right" style={{ verticalAlign: 'middle' }} />
                                    )}
                                </button>
                            </div>

                            <div
                                ref={this.defaultContainer}
                                className={classNames(
                                    styles.defaultContainer,
                                    styles.fixed
                                )}
                            >
                                <DefaultWidgets />
                            </div>
                            <div
                                ref={this.secondaryToggler}
                                className={classNames(styles.secondaryToggler)}
                            >
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={this.toggleSecondaryContainer}
                                >
                                    {!hideSecondaryContainer && (
                                        <i className="fa fa-chevron-right" style={{ verticalAlign: 'middle' }} />
                                    )}
                                    {hideSecondaryContainer && (
                                        <i className="fa fa-chevron-left" style={{ verticalAlign: 'middle' }} />
                                    )}
                                </button>
                            </div>
                            <div
                                ref={this.secondaryContainer}
                                className={classNames(
                                    styles.secondaryContainer,
                                    { [styles.hidden]: hideSecondaryContainer }
                                )}
                            >
                                <SecondaryWidgets
                                    onForkWidget={this.widgetEventHandler.onForkWidget}
                                    onRemoveWidget={this.widgetEventHandler.onRemoveWidget}
                                    onDragStart={this.widgetEventHandler.onDragStart}
                                    onDragEnd={this.widgetEventHandler.onDragEnd}
                                />
                            </div>
                        </div>
                    </div>
                </Dropzone>
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => ({
    addGcode: (name, gcode, renderMethod) => dispatch(workspaceActions.addGcode(name, gcode, renderMethod)),
    clearGcode: () => dispatch(workspaceActions.clearGcode())
});

export default connect(null, mapDispatchToProps)(withRouter(Workspace));
