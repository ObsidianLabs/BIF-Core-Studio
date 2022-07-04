import React, { PureComponent } from 'react'

import platform from '@obsidians/platform'
import { connect } from '@obsidians/redux'
import Project, { DeployButton, NewProjectModal } from '@obsidians/project'
import ProjectManager from './ProjectManager'
import ProjectSettingsTab from './ProjectSettingsTab'
import { modelSessionManager } from '@obsidians/code-editor'

modelSessionManager.registerCustomTab('settings', ProjectSettingsTab, 'Project Settings')

DeployButton.defaultProps = {
  skipEstimate: true,
  skipTranscation: true
}

class ProjectWithProps extends PureComponent {
  async componentDidMount() {
    this.props.cacheLifecycles.didRecover(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }

  render() {
    const { projects, uiState, match } = this.props;
    if (!match?.params) {
      return null;
    }
    const { username, project } = match?.params;
    const selected = projects.get('selected')?.toJS() || {};

    let type, projectRoot;
    if (username === 'local') {
      type = 'Local';
      projectRoot = selected.path;
    } else {
      type = 'Remote';
      projectRoot = selected.id ? `${username}/${project}` : undefined;
    }

    return type === 'Local' && platform.isWeb ? null : (
      <Project
        theme="obsidians"
        projectRoot={projectRoot}
        ProjectManager={ProjectManager}
        type={type}
        signer={uiState.get('signer')}
      />
    );
  }
}

export default connect(['uiState', 'projects'])(ProjectWithProps)
