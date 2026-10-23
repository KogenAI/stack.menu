/** Documentation scope only; this does not certify application compatibility. */
export function assessMigration(source, target, context = {}) {
 const roles = profile => [...new Set(Array.isArray(profile?.kind) ? profile.kind : [])];
 const documentedResponsibilities = profile => {
  const kind = roles(profile);
  const declared = Array.isArray(profile?.roles) ? profile.roles : profile?.responsibilities;
  const responsibilities = Array.isArray(declared) ? declared.filter(value => typeof value === 'string').map(value => value.includes(':') ? value.split(':')[0].trim() : value) : [];
  if (kind.includes('web') && ['server','full'].includes(profile?.ui)) responsibilities.push('browser-ui');
  if (kind.includes('web') && ['server','full'].includes(profile?.ui) && ['server','node'].includes(profile?.host)) responsibilities.push('server-runtime');
  if (kind.includes('web') && profile?.ui === 'client' && profile?.host === 'static') responsibilities.push('browser-ui');
  if (kind.includes('api') && !kind.includes('web')) responsibilities.push('server-runtime');
  return [...new Set(responsibilities)];
 };
 const responsibilityLabels = {'browser-ui':'browser UI','server-runtime':'server runtime'};
 const documentedSource = roles(source);
 const source_roles = context.component && documentedSource.includes(context.component)
  ? [context.component] : documentedSource;
 const target_roles = roles(target);
 const missing_roles = source_roles.filter(role => !target_roles.includes(role));
 let source_responsibilities = documentedResponsibilities(source);
 const target_responsibilities = documentedResponsibilities(target);
 // An API boundary can narrow runtime responsibilities, but cannot silently
 // discard application-specific publishing, commerce or other responsibilities.
 if (context.component === 'api' && documentedSource.includes('api') && source_responsibilities.includes('server-runtime'))
  source_responsibilities = source_responsibilities.filter(role => role !== 'browser-ui');
 const missing_responsibilities = source_responsibilities.filter(role => !target_responsibilities.includes(role));
 const source_only = !!(source && (source.source_only || source.sourceOnly || Array.isArray(source.inventory)));
 const unknown_source = !!(source && (source.unknown_source || source.id === 'other'));
 const constraint_conflicts = [];
 const questions = [];
 if (!source) questions.push('Which current stack and application component are being replaced?');
 if (!target) questions.push('Which selected target should be evaluated for that component?');
 if (unknown_source) questions.push('This source is not covered by a maintained source guide. Identify the actual system, exact versions, lifecycle evidence, application responsibilities, interfaces and owners before evaluating the selected target.');
 if (source_only) questions.push('Inventory the actual application, integrations and data. For each responsibility, name what is kept, replaced or retired, its responsible owner and interfaces, validation and rollback. Is this a partial move or a full replacement? A source guide or completed inventory is not evidence of compatibility.');
 if (context.component && source && !documentedSource.includes(context.component)) {
  constraint_conflicts.push(`The source does not document the requested ${context.component} component.`);
  questions.push(`Where does the requested ${context.component} component exist in the actual source application, and which owner, interface and boundary are being moved? The source documentation does not establish that component; inspect it before proceeding.`);
 }
 if (source && target && missing_roles.length) {
  questions.push(`Which component boundary is being replaced? The source documents ${source_roles.join(', ')}; the selected target documents ${target_roles.join(', ') || 'no component roles'}. How will the ${missing_roles.join(', ')} interface be kept, replaced or intentionally retired, and who owns it? Missing target documentation is a coverage gap, not proof replacement is impossible.`);
 }
 if (source && target && missing_responsibilities.length) {
  const labels = missing_responsibilities.map(role => responsibilityLabels[role] ?? role);
  questions.push(`The source documents responsibilities outside the selected target guide: ${labels.join(', ')}. Identify their kept, replaced or retired scope, implementation owners, interfaces and checks. Research missing target coverage before claiming compatibility or impossibility.`);
 }
 if (context.component && target && !target_roles.includes(context.component)) {
  constraint_conflicts.push(`The selected target does not document the requested ${context.component} component.`);
  if (!missing_roles.length) questions.push(`How will the requested ${context.component} interface be retained in a separate component or composition alongside the selected target, or is a changed product surface intended?`);
 }
 if (target && context.ui && context.ui !== 'any' && context.component === 'web' && target.ui !== context.ui) {
  constraint_conflicts.push('The selected target does not match the supplied web UI architecture.');
  questions.push('How will the required web UI architecture be provided while preserving the selected target and retained interface?');
 }
 if (target && context.static_only && target.host !== 'static') {
  constraint_conflicts.push('The selected target needs a runtime rather than static-only hosting.');
  questions.push('Which separately hosted runtime will own the selected target, and which component remains static-only? Resolve the hosting boundary before treating this target as feasible.');
 }
 if (target && context.offline_edits && context.component === 'web' && !['client', 'full'].includes(target.ui)) {
  constraint_conflicts.push('The selected target requires a separate offline-capable browser client.');
  questions.push('Which retained or separate browser client will own offline storage, synchronization and conflicts alongside the selected target?');
 }
 return {source_roles, target_roles, missing_roles, source_responsibilities, target_responsibilities,
  missing_responsibilities, constraint_conflicts, source_only, unknown_source,
  requires_clarification: questions.length > 0, questions};
}
