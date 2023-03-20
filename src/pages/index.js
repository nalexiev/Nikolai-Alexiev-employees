import { useState } from "react";
import Head from "next/head";
import Papa from "papaparse";
import moment from "moment";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [fileData, setFileData] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [maxWorkedTogetherEmployees, setMaxWorkedTogetherEmployees] =
    useState(false);
  /**
   * Group the CSV data by ProjectID.
   * @param {Array} data
   * @returns Array
   */
  const groupDataByProjectID = (data) => {
    const projects = [];

    data.forEach((item) => {
      const EmpID = item.EmpID;
      const ProjectID = item.ProjectID;

      if (!projects[ProjectID]) {
        projects[ProjectID] = [];
      }

      const dateFrom = moment(item.DateFrom);
      const dateTo = item.DateTo === "NULL" ? moment() : moment(item.DateTo);

      projects[ProjectID].push({
        EmpID: EmpID,
        DateFrom: dateFrom,
        DateTo: dateTo,
      });
    });

    return projects;
  };

  /**
   * Reset current state and to be able to upload a new CSV file.
   */
  const onClickResetHandler = () => {
    setFileData(false);
    setIsSubmitted(false);
  };

  /**
   * Set current component state with the file coming from the form.
   * @param {Event} event
   */
  const onChangeHandler = (event) => {
    try {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          setFileData(results.data);
        },
      });
    } catch (e) {
      // @todo
      // show error message if the correct file is not choosen
    }
  };

  /**
   * Set current component state that the form is submitted and process the data from the CSV file.
   * @param {Event} event
   */
  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (!fileData) {
      return;
    }

    setIsSubmitted(true);

    const allProjects = groupDataByProjectID(fileData);
    const allProjectsMaxDays = [];
    const comparedEmployees = [];

    allProjects.forEach((employeesArray, index) => {
      const projectMaxDays = [];

      for (let i = 0; i < employeesArray.length; i++) {
        for (let a = employeesArray.length - 1; a >= 0; --a) {
          const employee1 = employeesArray[i];
          const employee2 = employeesArray[a];

          if (employee1.EmpID != employee2.EmpID) {
            const maxStartDate =
              employee1.DateFrom > employee2.DateFrom
                ? employee1.DateFrom
                : employee2.DateFrom;

            const minEndDate =
              employee1.DateTo < employee2.DateTo
                ? employee1.DateTo
                : employee2.DateTo;

            const daysWorkTogether = minEndDate.diff(maxStartDate, "days");
            const employeeKey = `${employee1.EmpID}-${employee2.EmpID}-${index}`;

            if (
              daysWorkTogether > 0 &&
              comparedEmployees.indexOf(employeeKey) === -1
            ) {
              projectMaxDays.push({
                ProjectID: index,
                EmpID1: employee1.EmpID,
                EmpID2: employee2.EmpID,
                DaysWorked: daysWorkTogether,
              });

              comparedEmployees.push(
                `${employee1.EmpID}-${employee2.EmpID}-${index}`
              );
              comparedEmployees.push(
                `${employee2.EmpID}-${employee1.EmpID}-${index}`
              );
            }
          }
        }
      }

      if (projectMaxDays.length > 0) {
        const maxWorkedTogether = projectMaxDays.reduce((prev, current) => {
          return prev.DaysWorked > current.DaysWorked ? prev : current;
        });
        allProjectsMaxDays.push(maxWorkedTogether);
      }
    });

    if (allProjectsMaxDays.length > 0) {
      setMaxWorkedTogetherEmployees(allProjectsMaxDays);
    }
  };

  // If the form should be visible or the results by preprocessing.
  const showForm = !fileData || !isSubmitted;

  return (
    <>
      <Head>
        <title>Employees</title>
      </Head>
      <main className={styles.main}>
        {showForm && (
          <form onSubmit={onSubmitHandler}>
            <h1>Please, upload CSV file:</h1>
            <input
              onChange={onChangeHandler}
              type="file"
              name="employees"
              accept=".csv"
            />
            <input type="submit" value="Upload" />
          </form>
        )}

        {isSubmitted && (
          <>
            <h1>Employees worked the most time on the same project are:</h1>
            {maxWorkedTogetherEmployees && (
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th className={styles.tableElement}>Employee ID #1</th>
                    <th className={styles.tableElement}>Employee ID #2</th>
                    <th className={styles.tableElement}>Project ID</th>
                    <th className={styles.tableElement}>Days worked</th>
                  </tr>
                </thead>
                <tbody>
                  {maxWorkedTogetherEmployees.map(
                    (maxProjectWorkedTogether, index) => {
                      return (
                        <tr key={index}>
                          <td className={styles.tableElement}>
                            {maxProjectWorkedTogether.EmpID1}
                          </td>
                          <td className={styles.tableElement}>
                            {maxProjectWorkedTogether.EmpID2}
                          </td>
                          <td className={styles.tableElement}>
                            {maxProjectWorkedTogether.ProjectID}
                          </td>
                          <td className={styles.tableElement}>
                            {maxProjectWorkedTogether.DaysWorked}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
            <input
              className={styles.resetButton}
              onClick={onClickResetHandler}
              type="button"
              value="Try other CSV file"
            />
          </>
        )}
      </main>
    </>
  );
}
