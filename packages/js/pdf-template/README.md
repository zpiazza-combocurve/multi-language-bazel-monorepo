# PDF Template
To install dependencies, run:
```yarn install```
in the root directory of the project.

To run the template in the dev mode, run:
```yarn start```

To build the template, run:
```yarn build```

## Summary

### Problem:
We need to take control of styling and maintaining the HTML template that is used for generating Custom PDF Reports

### Solution:
Create a new place where these templates could be run in developer mode or build to be used for production.
To take control of the dev and build flow we could use the simple gulp task runner.

To build an HTML Template we need to create an HTML file with a "Jinja" syntax that is used on the Python side for generating an HTML file with data, that would be used further for PDF generation.

For styling purposes, we will use SCSS which would be precompiled in the simple CSS file and that would be enough.

Here is a small description of the flow in different modes

#### Dev:
- Compile Jinja HTML with the mock data into the simple HTML file
- Precompile SCSS files and bundle them into one CSS file
- Serve everything locally
- Watch for the changes and reload the page if changes appeared

#### Build:
- Move the Jinja template to the build folder without compiling
- Precompile SCSS into the CSS and bundle it
- Modify HTML and instead of classes make inline styles
- Minify HTML to the 1 string, in this format it would be transferred to the Python BE

## Links

[Gulp.js docs](https://gulpjs.com/)
[Jinja docs](https://jinja.palletsprojects.com/en/3.1.x/)
[Pull Request Checklist](https://github.com/insidepetroleum/main-combocurve/wiki/New-Pull-Request-Checklist)
