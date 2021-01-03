import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import store from '../../store';
import Widget from '../../widgets';
import styles from './widgets.styl';

/**
 * all widgets render in page or not decinded width store setting by name of widgets,see app/store/
 * DefaultWidgets
 */
const DefaultWidgets = (props) => {
    const { className } = props;
    const defaultWidgets = store.get('workspace.container.default.widgets');
    const widgets = _.map(defaultWidgets, (widgetId) => (
        <div data-widget-id={widgetId} key={widgetId}>
            <Widget
                widgetId={widgetId}
            />
        </div>
    ));

    return (
        <div className={classNames(className, styles.widgets)}>
            {widgets}
        </div>
    );
};

DefaultWidgets.propTypes = {
    className: PropTypes.string
};

export default DefaultWidgets;
