# AtCoder Run - VSCode

This VSCode Extension enhances your AtCoder experience.

Works with `Python`, `C`, `C++` and `Go`.

## Features

- ### Run Test

  Fetch samples of the task and execute the tests automatically.
  Then quickly view the results in the Output tab.
  
## Commands

- Run Test : `atcoder-run.runTest`

- Login : `atcoder-run.login`

- Logout : `atcoder-run.logout`

## Task specification

To run the test, you need to specify the Contest ID (abc266, arc032 ...) and Task Index (a, b, c ...).

- **Specify with Comment**

  OK
  ```cpp
  // abc123 a
  // ABC123 A
  //  abc123  a
  // abc123-a
  // abc123_a
  // sample2023-final a
  // sample2023-final-a
  ```
  NG
  ```cpp
  // abc 123 a
  // abc123 : a
  // AtCoder Beginner Contest 123 a
  // sample2023 final a
  ```
- **Specify with File Structure**
  ```
  abc
   |- 123         
   |   |- a.cpp
   |   |- b.cpp
   |   |  ...
   |    
   |- 124
       |- a.cpp
       |- b.cpp
       |  ...
  ```



## Why is login information required?

The reason why login information is required is that we need to login when
accessing the task URL of the ongoing contests.

Your information is stored securely using secret storage, and we never use it for any other purposes.

## Release Notes

See [CHANGELOG](./CHANGELOG.md).
