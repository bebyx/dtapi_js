import {Component, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../shared/auth.service';
import {ApiService} from '../../shared/services/api.service';
import {Faculty, Group, Speciality, StudentInfo, TimeTable, TestsForStudent} from '../../shared/entity.interface';
import {Router} from '@angular/router';
import {Subject, Test} from '../../admin/entity.interface';
import {MatTable, MatTableDataSource} from '@angular/material';
import {ModalService} from '../../shared/services/modal.service';

@Component({
  selector: 'app-student-info',
  templateUrl: './student-info.component.html',
  styleUrls: ['./student-info.component.scss']
})
export class StudentInfoComponent implements OnInit {

  dataSource = new MatTableDataSource<TestsForStudent>();
  displayedColumns: string[] = [
    'subject',
    'test',
    'start',
    'end',
    'tasks',
    'duration',
    'attempts',
    'actions'
  ];

  @ViewChild('table', {static: false}) table: MatTable<Element>;


  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private modalService: ModalService
  ) {
  }

  studentId;
  studentInfo: StudentInfo;
  testInfo: TestsForStudent[];

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(data => {
      this.studentId = data.id;
      this.getStudentInfo(data.id);
    });
  }

  private getStudentInfo(id) {
    // GET Student Info
    this.apiService.getEntity('student', id).subscribe((data: StudentInfo[]) => {
      this.studentInfo = data[0];
      this.apiService.getEntity('group', this.studentInfo.group_id).subscribe((groupData: Group[]) => {
        this.studentInfo.group_name = groupData[0].group_name;
        this.studentInfo.faculty_id = groupData[0].faculty_id;
        this.studentInfo.speciality_id = groupData[0].speciality_id;
        this.apiService.getEntity('faculty', this.studentInfo.faculty_id).subscribe((facultyData: Faculty[]) => {
          this.studentInfo.faculty_name = facultyData[0].faculty_name;
          this.apiService.getEntity('speciality', this.studentInfo.speciality_id).subscribe((specialityData: Speciality[]) => {
            this.studentInfo.speciality_code = specialityData[0].speciality_code;
            this.studentInfo.speciality_name = specialityData[0].speciality_name;
            // GET Time Table & Test Details
            this.apiService.getEntityByAction('timeTable', 'getTimeTablesForGroup', this.studentInfo.group_id)
              .subscribe((result: TimeTable[]) => {
                let timeTable: any = [];
                result.forEach(item => {
                  delete item.timetable_id;
                  delete item.group_id;
                });
                timeTable = result;
                this.apiService.getEntity('Subject').subscribe((subjectData: Subject[]) => {
                  timeTable.forEach(value => {
                    subjectData.map(value1 => {
                      if (value1.subject_id === value.subject_id) {
                        value.subject_name = value1.subject_name;
                      }
                    });
                  });
                  // GET Test Info & make data in correct format for Data Source
                  this.apiService.getEntity('test').subscribe((testData: Test[]) => {
                    const filteredTests: any = timeTable.map(tt => testData.filter(test => test.subject_id === tt.subject_id));
                    const merged: Test[] = [].concat.apply([], filteredTests);
                    this.formDataSource(timeTable, merged);
                  });
                });
              });
          });
        });
      });
    });
  }

  private formDataSource(timeTableArray: TestsForStudent[], testArray: Test[]) {
    const data = [];
    testArray.forEach(value => {
      let row = {};
      timeTableArray.map(value1 => {
        if (value1.subject_id === value.subject_id) {
          row = Object.assign(value, value1);
          data.push(row);
        }
      });
    });
    this.dataSource.data = data;
  }

  public goToTest(testId, enabled, time) {
    console.log(enabled);
    if (enabled === '1') {
      this.router.navigate(['student/test-player'], {
        queryParams: {
          test_id: testId,
          time_for_test: time
        }
      });
    } else {
      this.modalService.openAlertModal('Тест ще не доступний для проходження на даний момент', '', '');
    }
  }

}