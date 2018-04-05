import {
  Component,
  Input,
  ElementRef,
  OnChanges,
  ViewChild,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MasterDetailCommands } from '../../core';
import { Alert } from '../../core/model';

@Component({
  selector: 'app-alert-detail',
  templateUrl: './alert-detail.component.html',
  styleUrls: ['./alert-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertDetailComponent implements OnChanges {
  @Input() alert: Alert;
  @Input() commands: MasterDetailCommands<Alert>;

  @ViewChild('name') nameElement: ElementRef;

  addMode = false;
  form = this.fb.group({
    id: [],
    name: ['', Validators.required],
    saying: ['']
  });

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges) {
    this.setFocus();
    if (this.alert && this.alert.id) {
      this.form.patchValue(this.alert);
      this.addMode = false;
    } else {
      this.form.reset();
      this.addMode = true;
    }
  }

  close() {
    this.commands.close();
  }

  saveAlert() {
    const { dirty, valid, value } = this.form;
    if (dirty && valid) {
      const newAlert = { ...this.alert, ...value };
      this.addMode
        ? this.commands.add(newAlert)
        : this.commands.update(newAlert);
    }
    this.close();
  }

  setFocus() {
    this.nameElement.nativeElement.focus();
  }
}
