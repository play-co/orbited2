from orbited2 import server
from orbited2 import config
import eventlet
import greenlet

#import threading
#import time

# Service Utilities
import win32serviceutil
import win32service

class OrbitedDirectConfig(config.OrbitedConfig):
    def __init__(self, config):
        self._load_config(config)

class WindowsService(win32serviceutil.ServiceFramework):
	_svc_name_ = "Orbited2"
	_svc_display_name_ = "Orbited 2.x COMET Server"
	_config_ = "C:\\Program Files\\Orbited\\etc\\orbited2.cfg"

	def __init__(self, args):
		win32serviceutil.ServiceFramework.__init__(self, args)
		self.hub = None
		self.ev = None

	def SvcStop(self):
		self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
		if not self.hub is None:
			print "submitting shutdown"
			# this is a spawn_r call done against a thread other than the one we are running on (on a specific thread hub)
			g = greenlet.greenlet(self.EvShutdown, parent=self.hub.greenlet)
			t = self.hub.schedule_call_global(0, g.switch, self)

	def EvShutdown(self, *args, **kwArgs):
		print "sending shutoff cmd"
		self.ev.send()

	def SvcDoRun(self):
		c = OrbitedDirectConfig(self._config_)
		s = server.OrbitedServer(c)
		self.hub = eventlet.hubs.get_hub()
		self.ev = s.run()
		print "entering wait"
		self.ev.wait()
		print "shutting down"
		self.hub.abort(True)
	
#	def thread_start(self):
#		print "thread launch"
#		time.sleep(5)
#		self.SvcStop()

if __name__=='__main__':
#	s = WindowsService(None)
#	orbited_thread = threading.Thread(target=s.thread_start)
#	orbited_thread.start()
#	s.SvcDoRun()
	win32serviceutil.HandleCommandLine(WindowsService)