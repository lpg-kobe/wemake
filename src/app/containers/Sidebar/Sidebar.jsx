import classNames from 'classnames';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import i18n from '../../lib/i18n';
import styles from './styles.styl';

const Sidebar = (props) => {
  const { location: { pathname = '' } } = props;

	return (
		<div className={styles.sidebar} id="sidebar">
			<nav className={styles.navbar}>
				<ul className={styles.nav}>
					<li
						className={classNames(
							'text-center',
							{ [styles.active]: pathname.indexOf('/workspace') === 0 }
						)}
					>
						<Link to="/workspace" title={i18n._('Workspace')}>
							<i
								className={classNames(
									styles.icon,
									styles.iconInvert,
									styles.iconXyz
								)}
							/>
						</Link>
					</li>
					<li
						className={classNames(
							'text-center',
							{ [styles.active]: pathname.indexOf('/laser') === 0 }
						)}
					>
						<Link to="/laser" title={i18n._('Laser G-code Generator')}>
							<i
								className={classNames(
									styles.icon,
									styles.iconInvert,
									styles.iconLaser
								)}
							/>
						</Link>
					</li>
				</ul>
				<ul className={styles.navFixedBottom}>
					<li
						className={classNames(
							'text-center',
							{ [styles.active]: pathname.indexOf('/settings') === 0 }
						)}
					>
						<Link to="/settings" title={i18n._('Settings')}>
							<i
								className={classNames(
									styles.icon,
									styles.iconInvert,
									styles.iconGear
								)}
							/>
						</Link>
					</li>
				</ul>
			</nav>
		</div>
	);
};

Sidebar.propTypes = {
	...withRouter.propTypes
};

export default withRouter(Sidebar);
