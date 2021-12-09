from ...abstraction.removers.base_remover import BaseRemover
from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: delete_campaign
class ExecuteCommand(BaseCommand):
    # DELETE CAMPAIGN
    def __delete_campaign(self):
        campaignId = self.get_argument("campaignId")
        resource_name = self.get_resource_by_id("campaigns", campaignId)

        # Remover instance
        remover = BaseRemover()

        # Initiate remover
        remover.initiate(self)

        #remove campaign
        result = remover.remove(resource_name=resource_name, resource_type="campaign")
        return result

    # start execution
    @override_method
    def start_execution(self):
        result = self.__delete_campaign()

        return result
