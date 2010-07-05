from setuptools import setup, find_packages
import os, sys

static_types = [
    '*.js', 
    '*.gz',
    '*.html',
    '*.css', 
    '*.ico', 
    '*.gif', 
    '*.jpg', 
    '*.png', 
    '*.txt*',
    '*.py',
    '*.template'
]

#if sys.platform != "win32":
#    _install_requires.append("Twisted")

setup(
    name='orbited2',
    version='2.0.a1',
    author='Michael Carter',
    author_email='CarterMichael@gmail.com',
    url='http://www.github.com/mcarter/orbited2',
    license='MIT License',
    description='A WebSocket-enabling proxy, so you can code against Websocket in any browser.',
    long_description='',
    packages= find_packages(),
    package_data = {'': reduce(list.__add__, [ '.svn' not in d and [ os.path.join(d[len('orbited2')+1:], e) for e in
            static_types ] or [] for (d, s, f) in os.walk(os.path.join('orbited2', 'static'))
        ]) },
    zip_safe = False,
    install_requires = ['csp_eventlet>=0.4.1'],
    entry_points = '''
        [console_scripts]
        orbited2 = orbited2.start:main
    ''',
    
    classifiers = [
        'Development Status :: 4 - Beta',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],        
)
