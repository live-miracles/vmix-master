' Script name: Slave
'
' Syncs active input, preview, and playback position with master.

' Update the master IP below:
Dim masterAPI As String = "http://192.168.x.x:8088/api"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Slave 1.1.0")

' ===== Configurations =====
Dim LOOP_TIME As Integer = 300
Dim TRANSITION_BUFFER As Integer = 3000
Dim POSITION_THRESHOLD As Integer = 60000  ' 1 minute in ms

Dim localXml As New System.Xml.XmlDocument()
Dim localResponse As String = ""
Dim localActive As String = ""
Dim localPreview As String = ""
Dim localPosition As Integer = 0
Dim localState As String = ""

Dim http As New System.Net.WebClient()
Dim responseText As String = ""
Dim masterXml As New System.Xml.XmlDocument()
Dim masterActive As String = ""
Dim masterPreview As String = ""
Dim masterPosition As Integer = 0
Dim masterState As String = ""

If masterAPI = "http://192.168.x.x:8088/api" Then
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " Slave | Please update the masterAPI " & masterAPI & ". Exiting...")
    Return
End If

Do While True
    Sleep(LOOP_TIME)

    Try
        ' --- LOCAL ---
        localResponse = API.XML()
        localXml.LoadXml(localResponse)
        localActive = localXml.SelectSingleNode("//active").InnerText
        localPreview = localXml.SelectSingleNode("//preview").InnerText

        Dim localInputNode = localXml.SelectSingleNode("//inputs/input[@number='" & localActive & "']")
        If Not localInputNode Is Nothing Then
            localPosition = CLng(localInputNode.Attributes("position").Value)
            localState = localInputNode.Attributes("state").Value
        Else
            localPosition = 0
            localState = ""
        End If

        ' --- MASTER ---
        responseText = http.DownloadString(masterAPI)
        masterXml.LoadXml(responseText)
        masterActive = masterXml.SelectSingleNode("//active").InnerText
        masterPreview = masterXml.SelectSingleNode("//preview").InnerText

        Dim masterInputNode = masterXml.SelectSingleNode("//inputs/input[@number='" & masterActive & "']")
        If Not masterInputNode Is Nothing Then
            masterPosition = CLng(masterInputNode.Attributes("position").Value)
            masterState = masterInputNode.Attributes("state").Value
        Else
            masterPosition = 0
            masterState = ""
        End If

        ' --- ACTIVE INPUT SYNC ---
        If masterActive <> localActive Then
            API.Function("Stinger1", Input:=masterActive)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Slave | New active: " & masterActive)
            Sleep(TRANSITION_BUFFER)
        End If

        ' --- PREVIEW SYNC ---
        If masterPreview <> localPreview Then
            API.Function("PreviewInput", Input:=masterPreview)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Slave | New preview: " & masterPreview)
        End If

        ' --- POSITION SYNC (ONLY IF BOTH PLAYING) ---
        Dim positionDiff = Math.Abs(masterPosition - localPosition)

        If masterActive = localActive And masterPosition <> 0 And localPosition <> 0 Then
            If positionDiff > POSITION_THRESHOLD And localState = "Running" And masterState = "Running" Then
                API.Function("SetPosition", Input:=masterActive, Value:=CStr(masterPosition))

                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " Slave | Position sync: " & masterPosition & " (diff: " & positionDiff & ")")

                Sleep(TRANSITION_BUFFER)
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Slave | Unexpected error: " & ex.Message)
    End Try
Loop
