async function test() {
  const payload = {
    name: 'CT-A2',
    departmentCode: 'CSE',
    departmentName: 'Computer Science and Engineering',
    semesterNumber: 2,
    semesterName: 'Second Semester'
  };
  const res = await fetch('https://campassist.onrender.com/api/v1/sections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log(res.status, await res.text());
}
test();
