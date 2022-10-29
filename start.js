//Reduired dependencies are below



const mysql = require('mysql2');

const cTable = require('console.table');

const inquirer = require('inquirer');

const db = mysql.createConnection(

    {
      host: 'localhost',

      user: 'root',

      password: 'none',

      database: 'tracker_db'
    },
    console.log(`Connection with tracker_db database complete`)
);



//------------------------------------------------------------------------------------------------------------------------------------//

//Inquirer questions here 
const questionGenerate = () => {

    return inquirer.prompt([
        {
            type: 'list',
            message: "What do you want to do?",
            name: 'choices',
            choices: [
                "See departments",
                "See jobs",
                "See workers",
                "New department",
                "New job",
                "New worker",
                "Add to job description"
            ]
        }
    ])
    .then((info) => {
        switch (info.selection) {
            case "See departments":
                seeDeps();
                break;

            case "See jobs":
                seeJobs();
                break;
                
            case "See workers":
                seeWorkers();
                break;
            
            case "New department":
                newDep();
                break;
        
            case "New job":
                newJob();
                break;
            
            case "New worker":
                newWorker();
                break;
                
            case "Add to job description":
                newJobDescription();
                break;
        }
    })
};

//----------------------------------------------------------------------------------------------------------------------------------//

// This calls the function to start the questions for the user
questionGenerate();

const seeDeps = () => {
    db.query(`SELECT * FROM department`, function (error, response) {

        console.log(`\n`);

        console.table(response);
        questionGenerate();
    })
}


//-----------------------------------------------------------------------------------------------------------------------------------//

//Let's you see all the jobs!

const seeJobs = () => {
    db.query(`SELECT * FROM role`, function (error, response) {
        console.log(`\n`);
        console.table(response);
        questionGenerate();
    })
}

//----------------------------------------------------------------------------------------------------------------------------------//

//Let's you look at all the workers!

const seeWorkers = () => {

    db.query(`
    SELECT
    employees_with_managers.id AS employee_id,
    employees_with_managers.first_name,
    employees_with_managers.last_name,
    employee_info.title,
    employee_info.salary,
    employee_info.department_name,
    employees_with_managers.manager_name
    FROM employee_info
    JOIN employees_with_managers on employee_info.job_typeID = employees_with_managers.job_typeID;
    `, function (error, response) {
        
        console.log(`\n`);
        console.table(response);
        questionGenerate();
    })
}

//-----------------------------------------------------------------------------------------------------------------------------------//

//Adds new department!

const newDep = () => {
    return inquirer.prompt([
        {
            type: 'input',
            message: "What's the name of the new department?",
            name: 'name'
        }
    ])
    .then((info) => {
        db.query(`INSERT INTO department (name) VALUES (?)`, info.name, (error, response) => {
            console.log("\nNew department detected. See changes:");
            seeDeps();
        })
    })
}


//--------------------------------------------------------------------------------------------------------------------------------------//

//Adds new job type!

const newJob = () => {
    let depDataGroup = [];

    db.query(`SELECT * FROM department`, function (error, response) {
        for (let i = 0; i < response.length; i++) {
            depDataGroup.push(response[i].name);
        }
        return inquirer.prompt([
            {
                type: 'input',
                message: "What's the name of the new job?",
                name: 'title',
            },
            {
                type: 'input',
                message: "How much moolah does it pay?",
                name: 'money',
            },
            {
                type: 'list',
                message: "What department is it in?",
                name: 'department',
                choices: depDataGroup
            }
        ])

        .then((info) => {
            // Retreives id for departments

            db.query(`SELECT id FROM department WHERE department.name = ?`, info.department, (error, response) => {
                let department_id = response[0].id;

            db.query(`INSERT INTO role(title, money, department_id)
            VALUES (?,?,?)`, [info.title, info.salary, department_id], (error, response) => {
                console.log("\nNew job addes, see changes:");
                seeJobs();
            })
            });
        })
    })
}

//-----------------------------------------------------------------------------------------------------------------------------------//

//Adds new employee!!

const newWorker = () => {

    const jobDataGroup= [];

    const empDataGroup= [];

    // Fills array with data for all jobs

    db.query(`SELECT * FROM role`, function (error, response) {
        for (let i = 0; i < response.length; i++) {

            jobDataGroup.push(response[i].title);
        }
    // Fills array with data for all employees
    db.query(`SELECT * FROM employee`, function (error, response) {

        for (let i = 0; i < response.length; i++) {

            let employeeName = `${response[i].first_name} ${response[i].last_name}`
            empDataGroup.push(employeeName);
        }
        return inquirer.prompt([
            {
                type: 'input',
                message: "What's their first name?",
                name: 'first_name',
            },
            {
                type: 'input',
                message: "What's their last name?",
                name: 'last_name',
            },
            {
                type: 'list',
                message: "What's their job description?",
                name: 'role',
                choices: jobDataGroup
            },
            {
                type: 'list',
                message: "Do they have an overlord/boss?",
                name: 'has_manager',
                choices: ["Ya", "Nah"]
            }
        ]).then((info) => {

            let jobType = info.role;
            let first_name = info.first_name;
            let last_name = info.last_name;
            let job_typeID = '';
            let manager = '';

            // Fills out the Ids for the jobs
            db.query(`SELECT id FROM role WHERE role.title = ?`, info.role, (error, response) => {
                job_typeID = response[0].id;
            });
            if (info.has_manager === "Ya") {
                return inquirer.prompt([

                    {
                    type: 'list',
                    message: "Tell us the manager's name",
                    name: 'manager',
                    choices: empDataGroup
                    }   
                ]).then((info) => {
                    // get role id
                    db.query(`SELECT id FROM role WHERE role.title = ?`, jobType, (error, response) => {
                        job_typeID = response[0].id;
                    })
                    db.query(`SELECT id FROM employee WHERE employee.first_name = ? AND employee.last_name = ?;`, info.manager.split(" "), (error, response) => {
                        manager = response[0].id;

                        db.query(`INSERT INTO employee (first_name, last_name, job_typeID, manager_id) 
                        VALUES (?,?,?,?)`, [first_name, last_name, job_typeID, manager], (error, response) => {
                            console.log("\nNew employee added. See below:");
                            seeWorkers();
                        })
                    })
                })

            } else {
                // Make manager a null value to avoid errors!

                manager = null;

                // Retrieves job ID
                db.query(`SELECT id FROM role WHERE role.title = ?`, jobType, (error, response) => {
                    job_typeID = response[0].id;

                    // Trying to correct error

                    db.query(`INSERT INTO employee (first_name, last_name, job_typeID, manager_id) 
                    VALUES (?,?,?,?)`, [info.first_name, info.last_name, job_typeID, manager], (error, response) => {
                        console.log("\nNew employee added. See below:");
                        seeWorkers();
                    })
                })
            }
        })
    })
})
}

//-----------------------------------------------------------------------------------------------------------------------------------//

//Add new job description!

const newJobDescription = () => {

    const jobDataGroup= [];

    const empDataGroup= [];

    // Fills array with new jobs and such

    db.query(`SELECT * FROM role`, function (error, response) {
        for (let i = 0; i < response.length; i++) {
            jobDataGroup.push(response[i].title);
        }
    // Fills array with new employee info

    db.query(`SELECT * FROM employee`, function (error, response) {
        for (let i = 0; i < response.length; i++) {

            let employeeName = `${response[i].first_name} ${response[i].last_name}`
            empDataGroup.push(employeeName);
        }
        return inquirer.prompt([
            {
                type: 'list',
                message: "Which job description do you want to update?",
                name: 'employee',
                choices: empDataGroup
            },
            {
                type: 'list',
                message: "What is their new job?",
                name: 'role',
                choices: jobDataGroup
            },

        ]).then((info) => {

            // This retrieves needed info

            db.query(`SELECT id FROM role WHERE role.title = ?;`, info.role, (error, response) => {
                job_typeID = response[0].id;

                db.query(`SELECT id FROM employee WHERE employee.first_name = ? AND employee.last_name = ?;`, info.employee.split(" "), (error, response) => {
                    db.query(`UPDATE employee SET job_typeID = ? WHERE id = ?;`, [job_typeID, response[0].id], (error, response) => {
                        console.log("\nEmployee role updated. See below:");
                        seeWorkers();
                    })
                })

            })
        })
    })
})
}

//I hope you like my project!!!! ")"

/* References


- https://www.npmjs.com/package/inquirer

- https://dev.to/rushankhan1/build-a-cli-with-node-js-4jbi

- https://developer.okta.com/blog/2019/03/11/node-sql-server

- https://www.simplilearn.com/tutorials/nodejs-tutorial/nodejs-mysql

- https://www.tutorialsteacher.com/nodejs/access-sql-server-in-nodejs

- https://www.npmjs.com/package/sql-client

- https://www.telerik.com/blogs/step-by-step-create-node-js-rest-api-sql-server-database

- https://docs.databricks.com/dev-tools/nodejs-sql-driver.html

- https://www.npmjs.com/package/mysql2

- https://stackoverflow.com/questions/25344661/what-is-the-difference-between-mysql-mysql2-considering-nodejs

- https://npmcompare.com/compare/mysql,mysql2 



*/