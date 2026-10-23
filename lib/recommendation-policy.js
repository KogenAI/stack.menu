/** Resolve task preferences identically in the browser and optional endpoint. */
export function resolveRecommendation(policy, input = {}) {
  const alias = policy.aliases?.[input.use_case];
  const taskId = alias?.use_case || input.use_case;
  const task = policy.use_cases.find(item => item.id === taskId);
  if (!task) throw new Error(`Unknown task ${taskId}. Read /recommendations.json.`);
  const constraints = {};
  for (const dimension of ['ecosystem', 'mobile_platform']) {
    const provided = input[dimension];
    const legacy = alias?.[dimension];
    if (legacy && provided && provided !== legacy && provided !== 'any')
      throw new Error(`The older ${input.use_case} link specifies ${dimension} ${legacy}. Use task ${taskId} to change that preference.`);
    const value = provided && provided !== 'any' ? provided : legacy;
    if (value && value !== 'any') constraints[dimension] = value;
  }
  const override = (task.overrides || []).find(item =>
    Object.entries(item.when).every(([key, value]) => constraints[key] === value));
  const selected = {...task, ...(override || {}), id: task.id, constraints: task.constraints};
  delete selected.when;
  selected.pending_questions = [];
  if (taskId === 'cross-platform-mobile' && ['ios', 'android'].includes(constraints.mobile_platform)) {
    selected.component = constraints.mobile_platform;
    selected.required_roles = [constraints.mobile_platform];
  } else if (taskId === 'cross-platform-mobile' && !constraints.mobile_platform) {
    selected.required_roles = [];
    selected.role_options = ['ios', 'android'];
    selected.pending_questions.push('Should this be one shared iOS/Android client, or a platform-specific client?');
  }
  selected.alternatives = policy.alternatives.filter(item => item.use_cases.includes(taskId)
    && (!selected.alternative_ids || selected.alternative_ids.includes(item.id))
    && item.profile_id !== selected.primary);
  const unresolved = Object.entries(constraints).filter(([key, value]) =>
    !task.constraints?.[key]?.includes(value)).map(([key, value]) =>
      `This task has no reviewed ${key} preference for ${value}; verify that requirement before treating its default as a fit.`);
  return {task: selected, constraints, alias: alias ? input.use_case : null, unresolved};
}
