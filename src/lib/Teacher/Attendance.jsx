/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import AttendanceSheet from "./AttendanceSheet";
import QRCode from "qrcode.react";

const Attendance = () => {
  const [courses, setCourses] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [warning, setWarning] = useState("");
  const [sessionDetails, setSessionDetails] = useState({});
  const [qrCodeData, setQrCodeData] = useState("");
  const teacherName = 'Dr. Rudra Pratap Deb Nath';
  const courseCode = 'CSE-413';

  useEffect(() => {
    fetch('http://localhost:5000/api/attendance/teacher')
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.data);
        console.log(data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);


 
  const CreateSessionForm = ({ course }) => {
    const localDate = new Date();
    const localDateString = localDate.toLocaleDateString("en-CA");
    const localTimeString = localDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (sessionActive) {
          setWarning("You can't create session more than once at a time");
          return;
        }
        setWarning('');

        const formData = new FormData(e.target);
        const data = {
            course_id: course.course_id,
            course_code: formData.get('course_code'),
            semester: Number(formData.get('semester')),
            class_startDate: formData.get('date'),
            class_startTime: `${formData.get('time')}:00`, // Append ":00" to the time
            duration: Number(formData.get('minutes')),
            session: formData.get('session'), // Ensure session is included in the payload
            secret_code: "-",
        };

        console.log('Data to be sent:', data);

        try {
            const response = await fetch('http://localhost:5000/api/attendance/teacher/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (response.ok) {
                console.log('Session created successfully');
            } else {
                console.error('Error creating session:', responseData);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="courseDetails">Course Name & Course Code</label>
                <div className="mt-1 flex">
                    <Input
                        type="text"
                        id="courseName"
                        defaultValue={course.course_title}
                        readOnly
                        name="course_name"
                        className="mr-2"
                    />
                    <Input
                        type="text"
                        id="courseCode"
                        defaultValue={course.course_code}
                        readOnly
                        name="course_code"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="semester">Session & Semester</label>
                <div className="mt-1 flex">
                    <Input
                        type="text"
                        id="session"
                        defaultValue={course.session}
                        readOnly
                        name="session"
                        className="mr-2"
                    />
                    <Input
                        type="text"
                        id="semester"
                        defaultValue={course.semester}
                        readOnly
                        name="semester"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="date">Session Date</label>
                <div className="mt-1">
                    <Input
                        type="date"
                        id="date"
                        defaultValue={localDateString}
                        name="date"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="time">Session Time</label>
                <div className="mt-1">
                    <Input
                        type="time"
                        id="time"
                        defaultValue={localTimeString}
                        name="time"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="minutes">Duration (in minutes)</label>
                <div className="mt-1">
                    <Input
                        type="number"
                        id="minutes"
                        name="minutes"
                    />
                </div>
            </div>
            <button type="submit" className="bg-[#0C4A6E] text-white py-2 px-4 rounded-md font-semibold">
                Create Session
            </button>
        </form>
    );
};



  const [countdown, setCountdown] = useState(0);

  const startCountdown = (totalMinutes) => {
    setSessionActive(true);
    const totalSeconds = totalMinutes * 60;
    const endTime = Date.now() + totalSeconds * 1000;
    localStorage.setItem('countdownEndTime', endTime);
    setCountdown(totalSeconds);

    const interval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 0) {
          return prevCountdown - 1;
        } else {
          clearInterval(interval);
          localStorage.removeItem('countdownEndTime');
          setSessionActive(false);
          return 0;
        }
      });
    }, 1000);

    return interval;
  };

  useEffect(() => {
    const endTime = localStorage.getItem('countdownEndTime');
    const savedSessionDetails = localStorage.getItem('sessionDetails');

    if (savedSessionDetails) {
      setSessionDetails(JSON.parse(savedSessionDetails));
    }

    if (endTime) {
      const remainingTime = Math.floor((endTime - Date.now()) / 1000);
      if (remainingTime > 0) {
        setCountdown(remainingTime);
        setSessionActive(true);
        const interval = setInterval(() => {
          setCountdown((prevCountdown) => {
            if (prevCountdown > 0) {
              return prevCountdown - 1;
            } else {
              clearInterval(interval);
              localStorage.removeItem('countdownEndTime');
              localStorage.removeItem('sessionDetails');
              setSessionActive(false);
              return 0;
            }
          });
        }, 1000);
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem('countdownEndTime');
        localStorage.removeItem('sessionDetails');
      }
    }
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div>
      <div className="flex justify-center gap-20">
        <div className="p-10">
          <p className="pb-1 text-3xl font-bold">Teachers' Name: Rudra Pratap Deb Nath</p>
          <p className="pt-1 text-xl">Designation: Designation</p>
          <p className="pt-1 text-xl">Assigned Course: {courses.length}</p>
        </div>
        <div className="flex justify-center items-center">
          <img
            className="inline-block h-36 w-36 rounded-full ring-8 ring-slate-400"
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80"
            alt=""
          />
        </div>
      </div>
      <div>
        <hr className="border-2" style={{ borderColor: '#CCCCCC' }} />
      </div>

      {countdown > 0 && (
        <div className="p-10">
          <div className="flex flex-row-reverse justify-center gap-28 ">
            <div>
              <div className="mb-4 text-3xl font-bold">
                Currently a session is conducted <br />
                {/* <span className="text-lg"></span> */}
              </div>
              <div className="mb-4 text-3xl font-bold">
                Would you like to provide attendance <br /> for the ongoing session?
              </div>
              <p className="text-xl font-semibold">Course Name : {sessionDetails.courseName}</p>
              <p className="text-xl font-semibold">Course Code : {sessionDetails.courseCode}</p>
              <p className="text-xl font-semibold">Date : {sessionDetails.date}</p>
              <p className="text-xl font-semibold">Starting Time: {sessionDetails.time}</p>
              <p className="text-xl font-bold">End Time: {new Date(Date.now() + countdown * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="text-xl font-bold">Time left: {formatTime(countdown)}</p>
            </div>
            <div className="flex justify-center items-center">
              <QRCode className="w-64" size={240} fgColor={'#66798F'} value={qrCodeData} />
              </div>
          </div>
          <div>
            <hr className="border-2 mt-8" style={{ borderColor: '#CCCCCC' }} />
          </div>
        </div>
      )}

      {warning && (
        <div className="flex justify-center mt-4">
          <p className="text-xl font-bold text-red-500">{warning}</p>
        </div>
      )}

      <div>
        <div className="overflow-x-auto p-10">
          <h1 className="text-3xl mb-4 font-bold text-center">Assigned Courses Details</h1>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-3 text-center text-lg text-black">S.No</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Course Name</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Course Code</TableHead>
                 <TableHead className="p-3 text-center text-lg text-black">Program</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Type</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Semester</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Session</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Details</TableHead>
                <TableHead className="p-3 text-center text-lg text-black">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="text-center">{course.course_title}</TableCell>
                  <TableCell className="text-center">{course.course_code}</TableCell>
                  <TableCell className="text-center">{course.program_abbr}</TableCell>
                  <TableCell className="text-center">{course.course_type}</TableCell>
                  <TableCell className="text-center">{course.semester}</TableCell>
                  <TableCell className="text-center">{course.session}</TableCell>
                  <TableCell className="text-center">
                    <Link to={`/courseDetails/${course.id}`}>
                      <Button>View details</Button>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Popover>
                      <PopoverTrigger>
                        <Button onClick={(e) => {
                          if (sessionActive) {
                            e.preventDefault();
                            setWarning("You can't create session more than once at a time");
                          }
                        }}>Create Session</Button>
                      </PopoverTrigger>
                      {!sessionActive && (
                        <PopoverContent
                          style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translate(-200%, -80%)' }}
                          className="w-96 shadow-slate-950 shadow-2xl"
                        >
                          <CreateSessionForm course={course}  />
                        </PopoverContent>
                      )}
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="hidden">
            <AttendanceSheet courseCode={courseCode} teacherName={teacherName} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
