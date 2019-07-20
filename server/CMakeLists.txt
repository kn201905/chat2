cmake_minimum_required(VERSION 3.0)

# Name of the project (will be the name of the plugin)
project(chatsvr)

# 以下がないと、<node_api.h> における char16_t が認識されずエラーとなる
# CMAKE_CXX_FLAGS で指定されたものが g++ に渡される
# ${CMAKE_CXX_FLAGS} は、コマンドラインで指定されたオプションを表す
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -Wall")

# Build a shared library named after the project from the files in `src/`
file(GLOB SOURCE_FILES "src/*.cc" "src/*.hh")
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})

# Gives our library file a .node extension without any "lib" prefix
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Essential include files to build a node addon,
# You should add this line in every CMake.js based project
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})

# Essential library files to link to a node addon
# You should add this line in every CMake.js based project
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
