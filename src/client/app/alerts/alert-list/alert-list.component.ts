import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { Alert, MasterDetailCommands } from '../../core';

@Component({
  selector: 'app-alert-list',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertListComponent {
  @Input() alerts: Alert[];
  @Input() selectedAlert: Alert;
  @Input() commands: MasterDetailCommands<Alert>;

  byId(alert: Alert) {
    return alert.id;
  }

  onSelect(alert: Alert) {
    this.commands.select(alert);
  }

  deleteAlert(alert: Alert) {
    this.commands.delete(alert);
  }
}
