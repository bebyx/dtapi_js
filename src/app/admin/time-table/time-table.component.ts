import {Component, OnInit, ViewChild} from '@angular/core';
import {Group, Subject} from '../entity.interface';
import {FormBuilder} from '@angular/forms';
import {TimeTable} from '../../shared/entity.interface';
import {MatDialog, MatPaginator, MatTable, MatTableDataSource} from '@angular/material';
import {TimeTableAddDialogComponent} from './time-table-add-dialog/time-table-add-dialog.component';
import {ModalService} from '../../shared/services/modal.service';
import {ApiService} from 'src/app/shared/services/api.service';
import {isString} from 'util';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-time-table',
  templateUrl: './time-table.component.html',
  styleUrls: ['./time-table.component.scss']
})
export class TimeTableComponent implements OnInit {
  dataSource = new MatTableDataSource<TimeTable>();
  displayedColumns: string[] = [
    'id',
    'group',
    'start_date',
    'start_time',
    'end_date',
    'end_time',
    'actions'
  ];

  @ViewChild('table', {static: false}) table: MatTable<Element>;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(private apiService: ApiService,
              private formBuilder: FormBuilder,
              public dialog: MatDialog,
              private modalService: ModalService,
              private route: ActivatedRoute) {
  }

  subject: Subject;
  subjectId: any;
  id: any;
  timeTable: TimeTable[] = [];

  ngOnInit() {
    this.route.queryParamMap.subscribe((params: any) => {
      this.subjectId = params.params.id;
      this.getTimeTable(this.subjectId);
    });
    this.getSubjects();
  }

  addTimeTableDialog(): void {
    const dialogRef = this.dialog.open(TimeTableAddDialogComponent, {
      width: '600px',
      data: {
        data: {
          subject_id: this.subjectId,
          start_time: '',
          end_time: '',
        },
        description: {
          title: 'Додати новий розклад',
          action: 'Додати'
        },
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.start_date = this.formatDate(result.start_date);
        result.end_date = this.formatDate(result.end_date);
        result.start_time = result.start_time.length < 6 ? result.start_time + ':00' : result.start_time;
        result.end_time = result.end_time.length < 6 ? result.end_time + ':00' : result.end_time;
        delete result.timetable_id;
        this.addTimeTable(result);
      }
    });
  }

  editTimeTableDialog(tableEl: TimeTable): void {
    const dialogRef = this.dialog.open(TimeTableAddDialogComponent, {
      width: '600px',
      data: {
        data: tableEl,
        description: {
          title: 'Редагувати дані розкладу',
          action: 'Редагувати'
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.start_date = this.formatDate(result.start_date);
        result.end_date = this.formatDate(result.end_date);
        result.start_time = result.start_time.length < 6 ? result.start_time + ':00' : result.start_time;
        result.end_time = result.end_time.length < 6 ? result.end_time + ':00' : result.end_time;
        let groupName: string;
        this.apiService.getEntity('Group', result.group_id).subscribe((group: Group[]) => {
          groupName = group[0].group_name;
          this.editTimeTable(result, groupName);
        });
      }
    });
  }

  openConfirmDialog(tableEl: TimeTable) {
    const massage = `Ви дійсно хочете видалити розклад для групи: ${tableEl.group_name}`;
    this.modalService.openConfirmModal(massage, () => {
      this.deleteTimeTable(tableEl);
    });
  }

  private getSubjects() {
    this.apiService.getEntity('Subject').subscribe((response: Subject[]) => {
      const filteredSubject = response.filter(value => value.subject_id === this.subjectId);
      this.subject = filteredSubject[0];
    });
  }

  private getTimeTable(subjectId) {
    let table: TimeTable[];
    this.apiService.getEntityByAction('timeTable', 'getTimeTablesForSubject', subjectId)
      .subscribe((result: any) => {
        if (!result.response) {
          table = result;
          const ids = table.map(a => Number(a.group_id));
          this.apiService.getByEntityManager('Group', ids).subscribe((value1: Group[]) => {
            table.map(a => {
              value1.find(obj => {
                if (obj.group_id === a.group_id) {
                  a.group_name = obj.group_name;
                }
              });
            });
          });
          this.timeTable = table;
          this.dataSource.data = table;
          this.dataSource.paginator = this.paginator;
        } else {
          this.timeTable = [];
          this.dataSource.data = [];
        }
      });
  }

  private addTimeTable(data: TimeTable) {
    this.apiService.createEntity('TimeTable', data).subscribe((result: TimeTable[]) => {
      if (result[0].subject_id === this.subjectId) {
        const updatedTable: TimeTable[] = result;
        this.apiService.getEntity('Group', result[0].group_id).subscribe((value: Group[]) => {
          updatedTable[0].group_name = value[0].group_name;
          this.dataSource.data.push(updatedTable[0]);
          this.table.renderRows();
          this.dataSource.paginator = this.paginator;
        });
      }
    }, (error: any) => {
      if (error.error.response.includes('Wrong input')) {
        this.modalService.openInfoModal('Не правильно введені дані');
      } else if (error.error.response.includes('ERROR: SQLSTATE[23000]: Integrity constraint violation')) {
        this.modalService.openInfoModal('Розклад для вибраної групи та предмету вже заданий');
      } else {
        this.modalService.openInfoModal('Помилка оновлення');
      }
    });
  }

  private editTimeTable(data: TimeTable, groupName) {
    this.apiService.updEntity('timeTable', data, data.timetable_id).subscribe((result: TimeTable[]) => {
      const index: number = result
        ? this.timeTable.findIndex(
          tt => tt.timetable_id === result[0].timetable_id
        )
        : -1;
      if (index > -1) {
        result[0].group_name = groupName;
        this.timeTable[index] = result[0];
        this.dataSource.data[index] = result[0];
        this.table.renderRows();
        this.dataSource.paginator = this.paginator;
      }
    }, (error: any) => {
      if (error.error.response.includes('Wrong input')) {
        this.modalService.openInfoModal('Не правильно введені дані');
      } else {
        this.modalService.openInfoModal('Помилка оновлення');
      }
    });
  }

  private deleteTimeTable(data: TimeTable) {
    this.apiService.delEntity('timeTable', data.timetable_id).subscribe((result: any) => {
      if (result) {
        this.timeTable = this.timeTable.filter(tt => tt.timetable_id !== data.timetable_id);
        this.dataSource.data = this.timeTable;
        this.table.renderRows();
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  private formatDate(date) {
    if (!isString(date)) {
      let day: string = date.getDate().toString();
      day = +day < 10 ? '0' + day : day;
      let month: string = (date.getMonth() + 1).toString();
      month = +month < 10 ? '0' + month : month;
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    } else {
      return date;
    }
  }


}


